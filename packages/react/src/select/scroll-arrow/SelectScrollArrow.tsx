'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useTimeout } from '../../utils/useTimeout';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { Side } from '../../utils/useAnchorPositioning';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * @internal
 */
export const SelectScrollArrow = React.forwardRef(function SelectScrollArrow(
  componentProps: SelectScrollArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, direction, keepMounted = false, ...elementProps } = componentProps;

  const { store, popupRef, listRef } = useSelectRootContext();
  const {
    side,
    alignItemWithTriggerActive,
    scrollUpArrowVisible,
    scrollDownArrowVisible,
    setScrollUpArrowVisible,
    setScrollDownArrowVisible,
  } = useSelectPositionerContext();

  const visible = direction === 'up' ? scrollUpArrowVisible : scrollDownArrowVisible;

  const timeout = useTimeout();
  const scrollArrowRef = React.useRef<HTMLDivElement | null>(null);

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(visible);

  useOpenChangeComplete({
    open: visible,
    ref: scrollArrowRef,
    onComplete() {
      if (!visible) {
        setMounted(false);
      }
    },
  });

  const state: SelectScrollArrow.State = React.useMemo(
    () => ({
      direction,
      visible,
      side,
      transitionStatus,
    }),
    [direction, visible, side, transitionStatus],
  );

  const defaultProps: React.ComponentProps<'div'> = {
    hidden: !mounted,
    'aria-hidden': true,
    children: direction === 'down' ? '▼' : '▲',
    style: {
      position: 'absolute',
    },
    onMouseMove(event) {
      if (
        (event.movementX === 0 && event.movementY === 0) ||
        !alignItemWithTriggerActive ||
        timeout.isStarted()
      ) {
        return;
      }

      store.update({ ...store.state, activeIndex: null });

      function scrollNextItem() {
        const popupElement = popupRef.current;
        if (!popupElement) {
          return;
        }

        store.update({ ...store.state, activeIndex: null });

        const isScrolledToTop = popupElement.scrollTop === 0;
        const isScrolledToBottom =
          Math.round(popupElement.scrollTop + popupElement.clientHeight) >=
          popupElement.scrollHeight;

        if (direction === 'up') {
          setScrollUpArrowVisible(!isScrolledToTop);
        } else if (direction === 'down') {
          setScrollDownArrowVisible(!isScrolledToBottom);
        }

        if (
          (direction === 'up' && isScrolledToTop) ||
          (direction === 'down' && isScrolledToBottom)
        ) {
          timeout.clear();
          return;
        }

        if (popupRef.current && listRef.current && listRef.current.length > 0) {
          const items = listRef.current;
          const scrollArrowHeight = scrollArrowRef.current?.offsetHeight || 0;

          if (direction === 'up') {
            let firstVisibleIndex = 0;
            const scrollTop = popupElement.scrollTop + scrollArrowHeight;

            for (let i = 0; i < items.length; i += 1) {
              const item = items[i];
              if (item) {
                const itemTop = item.offsetTop;
                if (itemTop >= scrollTop) {
                  firstVisibleIndex = i;
                  break;
                }
              }
            }

            const targetIndex = Math.max(0, firstVisibleIndex - 1);
            const targetItem = items[targetIndex];
            if (targetIndex < firstVisibleIndex && targetItem) {
              popupElement.scrollTop = targetItem.offsetTop - scrollArrowHeight;
            }
          } else {
            let lastVisibleIndex = items.length - 1;
            const scrollBottom =
              popupElement.scrollTop + popupElement.clientHeight - scrollArrowHeight;

            for (let i = 0; i < items.length; i += 1) {
              const item = items[i];
              if (item) {
                const itemBottom = item.offsetTop + item.offsetHeight;
                if (itemBottom > scrollBottom) {
                  lastVisibleIndex = Math.max(0, i - 1);
                  break;
                }
              }
            }

            const targetIndex = Math.min(items.length - 1, lastVisibleIndex + 1);
            if (targetIndex > lastVisibleIndex) {
              const targetItem = items[targetIndex];
              if (targetItem) {
                popupElement.scrollTop =
                  targetItem.offsetTop +
                  targetItem.offsetHeight -
                  popupElement.clientHeight +
                  scrollArrowHeight;
              }
            }
          }
        }

        timeout.start(40, scrollNextItem);
      }

      timeout.start(40, scrollNextItem);
    },
    onMouseLeave() {
      timeout.clear();
    },
  };

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, scrollArrowRef],
    state,
    props: [defaultProps, elementProps],
  });

  const shouldRender = visible || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return element;
});

export namespace SelectScrollArrow {
  export interface State {
    direction: 'up' | 'down';
    visible: boolean;
    side: Side | 'none';
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    direction: 'up' | 'down';
    /**
     * Whether to keep the HTML element in the DOM while the select menu is not scrollable.
     * @default false
     */
    keepMounted?: boolean;
  }
}
