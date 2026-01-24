'use client';
import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { Side } from '../../utils/useAnchorPositioning';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import { selectors } from '../store';

/**
 * @internal
 */
export const SelectScrollArrow = React.forwardRef(function SelectScrollArrow(
  componentProps: SelectScrollArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, direction, keepMounted = false, ...elementProps } = componentProps;

  const { store, popupRef, listRef, handleScrollArrowVisibility, scrollArrowsMountedCountRef } =
    useSelectRootContext();
  const { side, scrollDownArrowRef, scrollUpArrowRef } = useSelectPositionerContext();

  const visibleSelector =
    direction === 'up' ? selectors.scrollUpArrowVisible : selectors.scrollDownArrowVisible;

  const stateVisible = useStore(store, visibleSelector);
  const openMethod = useStore(store, selectors.openMethod);

  // Scroll arrows are disabled for touch modality as they are a hover-only element.
  const visible = stateVisible && openMethod !== 'touch';

  const timeout = useTimeout();

  const scrollArrowRef = direction === 'up' ? scrollUpArrowRef : scrollDownArrowRef;

  const { transitionStatus, setMounted } = useTransitionStatus(visible);

  useIsoLayoutEffect(() => {
    scrollArrowsMountedCountRef.current += 1;
    if (!store.state.hasScrollArrows) {
      store.set('hasScrollArrows', true);
    }

    return () => {
      scrollArrowsMountedCountRef.current = Math.max(0, scrollArrowsMountedCountRef.current - 1);
      if (scrollArrowsMountedCountRef.current === 0 && store.state.hasScrollArrows) {
        store.set('hasScrollArrows', false);
      }
    };
  }, [store, scrollArrowsMountedCountRef]);

  useOpenChangeComplete({
    open: visible,
    ref: scrollArrowRef,
    onComplete() {
      if (!visible) {
        setMounted(false);
      }
    },
  });

  const state: SelectScrollArrow.State = {
    direction,
    visible,
    side,
    transitionStatus,
  };

  const defaultProps: React.ComponentProps<'div'> = {
    'aria-hidden': true,
    children: direction === 'up' ? '▲' : '▼',
    style: {
      position: 'absolute',
    },
    onMouseMove(event) {
      if ((event.movementX === 0 && event.movementY === 0) || timeout.isStarted()) {
        return;
      }

      store.set('activeIndex', null);

      function scrollNextItem() {
        const scroller = store.state.listElement ?? popupRef.current;
        if (!scroller) {
          return;
        }

        store.set('activeIndex', null);
        handleScrollArrowVisibility();

        const isScrolledToTop = scroller.scrollTop === 0;
        const isScrolledToBottom =
          Math.round(scroller.scrollTop + scroller.clientHeight) >= scroller.scrollHeight;

        const list = listRef.current;

        // Fallback when there are no items registered yet.
        if (list.length === 0) {
          if (direction === 'up') {
            store.set('scrollUpArrowVisible', !isScrolledToTop);
          } else {
            store.set('scrollDownArrowVisible', !isScrolledToBottom);
          }
        }

        if (
          (direction === 'up' && isScrolledToTop) ||
          (direction === 'down' && isScrolledToBottom)
        ) {
          timeout.clear();
          return;
        }

        if (
          (store.state.listElement || popupRef.current) &&
          listRef.current &&
          listRef.current.length > 0
        ) {
          const items = listRef.current;
          const scrollArrowHeight = scrollArrowRef.current?.offsetHeight || 0;

          if (direction === 'up') {
            let firstVisibleIndex = 0;
            const scrollTop = scroller.scrollTop + scrollArrowHeight;

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
            if (targetIndex < firstVisibleIndex) {
              const targetItem = items[targetIndex];
              if (targetItem) {
                scroller.scrollTop = Math.max(0, targetItem.offsetTop - scrollArrowHeight);
              }
            } else {
              // Already at the first item; ensure we reach the absolute top to account for group labels.
              scroller.scrollTop = 0;
            }
          } else {
            let lastVisibleIndex = items.length - 1;
            const scrollBottom = scroller.scrollTop + scroller.clientHeight - scrollArrowHeight;

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
                scroller.scrollTop =
                  targetItem.offsetTop +
                  targetItem.offsetHeight -
                  scroller.clientHeight +
                  scrollArrowHeight;
              }
            } else {
              // Already at the last item; ensure we reach the true bottom.
              scroller.scrollTop = scroller.scrollHeight - scroller.clientHeight;
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

export interface SelectScrollArrowState {
  direction: 'up' | 'down';
  visible: boolean;
  side: Side | 'none';
  transitionStatus: TransitionStatus;
}

export interface SelectScrollArrowProps extends BaseUIComponentProps<
  'div',
  SelectScrollArrow.State
> {
  direction: 'up' | 'down';
  /**
   * Whether to keep the HTML element in the DOM while the select popup is not scrollable.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace SelectScrollArrow {
  export type State = SelectScrollArrowState;
  export type Props = SelectScrollArrowProps;
}
