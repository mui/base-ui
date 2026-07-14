'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { getMinListIndex, isIndexOutOfListBounds } from '../../internals/composite/composite';
import { popupViewportStateMapping, usePopupViewport } from '../../utils/usePopupViewport';

/**
 * A viewport for displaying content transitions.
 * Use this component when the popup's content changes while open and the change should be animated.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuViewport = React.forwardRef(function MenuViewport(
  componentProps: MenuViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, children, transitionKey, ...elementProps } = componentProps;

  const { store } = useMenuRootContext();
  const { side } = useMenuPositionerContext();

  const instantType = store.useState('instantType');

  // The item list is rebuilt when the content swaps, so the previous highlight index points
  // at an arbitrary item of the new content. Clear it, and when focus was inside the swapped
  // content, highlight and focus the first item of the new content.
  const handleContentSwap = useStableCallback(({ focusWasInside }: { focusWasInside: boolean }) => {
    store.set('activeIndex', null);
    if (!focusWasInside) {
      return;
    }
    store.select('popupElement')?.focus({ preventScroll: true });
    // The new items commit their list registrations after this effect; highlight the first
    // item once the list has settled so `useListNavigation` moves focus to it.
    queueMicrotask(() => {
      if (!store.select('open')) {
        return;
      }
      const firstIndex = getMinListIndex(store.context.itemDomElements);
      if (!isIndexOutOfListBounds(store.context.itemDomElements.current, firstIndex)) {
        store.set('activeIndex', firstIndex);
      }
    });
  });

  const { children: childrenToRender, state: viewportState } = usePopupViewport({
    store,
    side,
    children,
    transitionKey,
    onContentSwap: handleContentSwap,
  });

  const state: MenuViewportState = {
    activationDirection: viewportState.activationDirection,
    transitioning: viewportState.transitioning,
    instant: instantType,
  };

  return useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [elementProps, { children: childrenToRender }],
    stateAttributesMapping: popupViewportStateMapping,
  });
});

export interface MenuViewportState {
  /**
   * The activation direction of the transitioned content.
   */
  activationDirection: string | undefined;
  /**
   * Whether the viewport is currently transitioning between contents.
   */
  transitioning: boolean;
  /**
   * Present if animations should be instant.
   */
  instant: 'dismiss' | 'click' | 'group' | 'trigger-change' | undefined;
}

export interface MenuViewportProps extends BaseUIComponentProps<'div', MenuViewportState> {
  /**
   * The content to render inside the transition container.
   */
  children?: React.ReactNode;
  /**
   * A key that identifies the current content. When it changes, the viewport animates to the new
   * content and highlights and focuses its first item if focus was inside the previous content.
   */
  transitionKey?: React.Key | undefined;
}

export namespace MenuViewport {
  export type Props = MenuViewportProps;
  export type State = MenuViewportState;
}
