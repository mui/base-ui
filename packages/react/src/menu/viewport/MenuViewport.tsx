'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { getMinListIndex, isIndexOutOfListBounds } from '../../internals/composite/composite';
import { popupViewportStateMapping, usePopupViewport } from '../../utils/usePopupViewport';

type TransitionDirection = 'forward' | 'back';

type InteractionType = 'keyboard' | 'pointer';

interface ViewHistoryEntry {
  key: React.Key | undefined;
  returnIndex: number | null;
}

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

  const [transitionDirection, setTransitionDirection] = React.useState<TransitionDirection>();

  const interactionTypeRef = React.useRef<InteractionType | null>(null);
  const lastTransitionKeyRef = React.useRef(transitionKey);

  // Each entry pairs a visited key with the highlight index to restore when returning to it,
  // so a jump back across several views restores the destination's own index.
  const viewHistoryRef = React.useRef<ViewHistoryEntry[]>([
    { key: transitionKey, returnIndex: null },
  ]);

  useIsoLayoutEffect(() => {
    if (!open) {
      interactionTypeRef.current = null;
      lastTransitionKeyRef.current = transitionKey;
      viewHistoryRef.current = [{ key: transitionKey, returnIndex: null }];
      setTransitionDirection(undefined);
    }
  }, [open, transitionKey]);

  const handleKeyDownCapture = useStableCallback(() => {
    interactionTypeRef.current = 'keyboard';
  });

  const handleClickCapture = useStableCallback((event: React.MouseEvent) => {
    interactionTypeRef.current = event.detail === 0 ? 'keyboard' : 'pointer';
  });

  // The item list is rebuilt when the content swaps, so clear the previous highlight index.
  // Keyboard navigation moves focus into the new view or back to the originating item, while
  // pointer navigation keeps focus on the popup and leaves all items unhighlighted.
  const handleContentSwap = useStableCallback(({ focusWasInside }: { focusWasInside: boolean }) => {
    let direction: TransitionDirection | undefined;
    let returnIndex: number | null = null;

    // A key seen earlier in the history means the content is returning to prior content;
    // an unseen key means it is entering new content. A swap without a key change is a
    // trigger switch, which is not directional. Returning may jump multiple levels at
    // once, so the destination entry's own return index is used rather than the last one.
    if (transitionKey !== lastTransitionKeyRef.current) {
      lastTransitionKeyRef.current = transitionKey;

      const history = viewHistoryRef.current;
      const existingIndex = history.findIndex((entry) => entry.key === transitionKey);

      if (existingIndex === -1) {
        history[history.length - 1].returnIndex = store.select('activeIndex');
        history.push({ key: transitionKey, returnIndex: null });
        direction = 'forward';
      } else {
        history.length = existingIndex + 1;
        returnIndex = history[existingIndex].returnIndex;
        direction = 'back';
      }
    }

    setTransitionDirection(direction);
    store.set('activeIndex', null);

    if (!focusWasInside) {
      interactionTypeRef.current = null;
      return;
    }

    store.select('popupElement')?.focus({ preventScroll: true });

    const wasKeyboardInteraction = interactionTypeRef.current === 'keyboard';
    interactionTypeRef.current = null;

    if (!wasKeyboardInteraction) {
      return;
    }

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
  });

  const { children: childrenToRender, state: viewportState } = usePopupViewport({
    store,
    side,
    children,
    transitionKey,
    onContentSwap: handleContentSwap,
  });

  const state: MenuViewportState = {
    activationDirection: transitionDirection ?? viewportState.activationDirection,
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
