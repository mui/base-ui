'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { getMinListIndex, isIndexOutOfListBounds } from '../../internals/composite/composite';
import {
  popupViewportStateMapping,
  type PopupViewportTransitionDirection,
  usePopupViewport,
} from '../../utils/usePopupViewport';

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
  const open = store.useState('open');
  const interactionTypeRef = React.useRef<{
    type: 'keyboard' | 'pointer';
  } | null>(null);
  const returnIndexesRef = React.useRef<Array<number | null>>([]);

  useIsoLayoutEffect(() => {
    if (!open) {
      interactionTypeRef.current = null;
      returnIndexesRef.current = [];
    }
  }, [open]);

  const setInteractionType = useStableCallback((type: 'keyboard' | 'pointer') => {
    interactionTypeRef.current = { type };
  });

  const handleKeyDownCapture = useStableCallback(() => {
    setInteractionType('keyboard');
  });

  const handleClickCapture = useStableCallback((event: React.MouseEvent) => {
    setInteractionType(event.detail === 0 ? 'keyboard' : 'pointer');
  });

  // The item list is rebuilt when the content swaps, so clear the previous highlight index.
  // Keyboard navigation moves focus into the new view or back to the originating item, while
  // pointer navigation keeps focus on the popup and leaves all items unhighlighted.
  const handleContentSwap = useStableCallback(
    ({
      focusWasInside,
      direction,
    }: {
      focusWasInside: boolean;
      direction: PopupViewportTransitionDirection | undefined;
    }) => {
      const activeIndex = store.select('activeIndex');
      let returnIndex: number | null = null;

      if (direction === 'forward') {
        returnIndexesRef.current.push(activeIndex);
      } else if (direction === 'back') {
        returnIndex = returnIndexesRef.current.pop() ?? null;
      }

      store.set('activeIndex', null);
      if (!focusWasInside) {
        interactionTypeRef.current = null;
        return;
      }

      store.select('popupElement')?.focus({ preventScroll: true });
      if (interactionTypeRef.current?.type !== 'keyboard') {
        interactionTypeRef.current = null;
        return;
      }

      interactionTypeRef.current = null;
      // The new items commit their list registrations after this effect. Once the list has
      // settled, focus either the originating item when returning or the first item when entering.
      queueMicrotask(() => {
        if (!store.select('open')) {
          return;
        }
        const nextIndex =
          direction === 'back' ? returnIndex : getMinListIndex(store.context.itemDomElements);
        if (
          nextIndex != null &&
          !isIndexOutOfListBounds(store.context.itemDomElements.current, nextIndex)
        ) {
          store.set('activeIndex', nextIndex);
        }
      });
    },
  );

  const { children: childrenToRender, state: viewportState } = usePopupViewport({
    store,
    side,
    children,
    transitionKey,
    onContentSwap: handleContentSwap,
  });

  const state: MenuViewportState = {
    activationDirection: viewportState.transitionDirection ?? viewportState.activationDirection,
    transitioning: viewportState.transitioning,
    instant: instantType,
  };

  return useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      elementProps,
      {
        children: childrenToRender,
        onKeyDownCapture: handleKeyDownCapture,
        onClickCapture: handleClickCapture,
      },
    ],
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
   * content. Keyboard navigation focuses the first item when entering and restores the originating
   * item when returning. Pointer navigation focuses the popup without highlighting an item.
   */
  transitionKey?: React.Key | undefined;
}

export namespace MenuViewport {
  export type Props = MenuViewportProps;
  export type State = MenuViewportState;
}
