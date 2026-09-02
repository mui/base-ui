'use client';
import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps } from '../../internals/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { Side } from '../../internals/useAnchorPositioning';
import { type TransitionStatus, useTransitionStatus } from '../../internals/useTransitionStatus';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import { useRenderElement } from '../../internals/useRenderElement';
import { transitionStatusMapping } from '../../internals/stateAttributesMapping';
import { getMaxScrollOffset, normalizeScrollOffset } from '../../utils/scrollEdges';
import { getTargetScrollTop, getVirtualizedTargetScrollTop } from '../utils/scrollArrowStepping';

/**
 * @internal
 */
export const SelectScrollArrow = React.forwardRef(function SelectScrollArrow(
  componentProps: SelectScrollArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, direction, keepMounted, ...elementProps } = componentProps;

  const isUp = direction === 'up';

  const store = useSelectRootContext();
  const { side, scrollDownArrowRef, scrollUpArrowRef } = useSelectPositionerContext();

  const visibleSelector = isUp ? 'scrollUpArrowVisible' : 'scrollDownArrowVisible';

  const stateVisible = store.useState(visibleSelector);
  const openMethod = store.useState('openMethod');

  // Scroll arrows are disabled for touch modality as they are a hover-only element.
  const visible = stateVisible && openMethod !== 'touch';

  const timeout = useTimeout();

  const scrollArrowRef = isUp ? scrollUpArrowRef : scrollDownArrowRef;

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(visible);

  useIsoLayoutEffect(() => {
    store.context.scrollArrowsMountedCountRef.current += 1;
    store.set('hasScrollArrows', true);

    return () => {
      store.context.scrollArrowsMountedCountRef.current = Math.max(
        0,
        store.context.scrollArrowsMountedCountRef.current - 1,
      );
      if (store.context.scrollArrowsMountedCountRef.current === 0) {
        store.set('hasScrollArrows', false);
      }
    };
  }, [store]);

  useOpenChangeComplete({
    open: visible,
    ref: scrollArrowRef,
    onComplete() {
      if (!visible) {
        setMounted(false);
      }
    },
  });

  const state: SelectScrollArrowState = {
    direction,
    visible,
    side,
    transitionStatus,
  };

  const defaultProps: React.ComponentProps<'div'> = {
    'aria-hidden': true,
    children: isUp ? '▲' : '▼',
    style: {
      position: 'absolute',
    },
    onMouseMove(event) {
      if ((event.movementX === 0 && event.movementY === 0) || timeout.isStarted()) {
        return;
      }

      store.context.setActiveIndex(null, 'none');

      function scrollNextItem() {
        const virtualizer = store.context.virtualizationRegistry.virtualizer;
        const scroller =
          virtualizer?.getScrollElement() ??
          store.state.listElement ??
          store.context.popupRef.current;
        if (!scroller) {
          return;
        }

        store.context.setActiveIndex(null, 'none');
        store.context.handleScrollArrowVisibility(scroller);

        const maxScrollTop = getMaxScrollOffset(scroller.scrollHeight, scroller.clientHeight);
        const scrollTop = normalizeScrollOffset(scroller.scrollTop, maxScrollTop);
        const isScrolledToEdge = scrollTop === (isUp ? 0 : maxScrollTop);
        const items = store.context.listRef.current;

        if (scrollTop !== scroller.scrollTop) {
          scroller.scrollTop = scrollTop;
        }

        if (isScrolledToEdge) {
          timeout.clear();
          return;
        }

        const scrollArrowHeight = scrollArrowRef.current?.offsetHeight || 0;

        if (virtualizer != null) {
          // A windowed row is positioned inside a transformed render zone, so its `offsetTop`
          // describes its place in that zone rather than in the scrolled content. The logical
          // metrics are the only geometry that covers the whole collection.
          const target = getVirtualizedTargetScrollTop(
            virtualizer,
            store.context.valuesRef.current.length,
            isUp,
            scrollTop,
            scroller.clientHeight,
            scrollArrowHeight,
            maxScrollTop,
          );
          // A row whose geometry is not available yet leaves the position alone; the next tick
          // reads the handle again, by which time more rows have been measured.
          if (target != null) {
            scroller.scrollTop = target;
          }
        } else if (items.length > 0) {
          scroller.scrollTop = getTargetScrollTop(
            items,
            isUp,
            scrollTop,
            scroller.clientHeight,
            scrollArrowHeight,
            maxScrollTop,
          );
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
    stateAttributesMapping: transitionStatusMapping,
  });

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return element;
});

export interface SelectScrollArrowState {
  /**
   * The direction of the element.
   */
  direction: 'up' | 'down';
  /**
   * Whether the element is visible.
   */
  visible: boolean;
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side | 'none';
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface SelectScrollArrowProps extends BaseUIComponentProps<
  'div',
  SelectScrollArrowState
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
