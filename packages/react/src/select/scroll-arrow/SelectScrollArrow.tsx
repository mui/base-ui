'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeProps } from '../../merge-props';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { Side } from '../../utils/useAnchorPositioning';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useForkRef } from '../../utils/useForkRef';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';

/**
 * @ignore - internal component.
 */
const SelectScrollArrow = React.forwardRef(function SelectScrollArrow(
  props: SelectScrollArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, direction, keepMounted = false, ...otherProps } = props;

  const {
    alignItemToTrigger,
    popupRef,
    scrollUpArrowVisible,
    scrollDownArrowVisible,
    setScrollUpArrowVisible,
    setScrollDownArrowVisible,
  } = useSelectRootContext();
  const { side } = useSelectPositionerContext();

  const visible = direction === 'up' ? scrollUpArrowVisible : scrollDownArrowVisible;

  const frameRef = React.useRef(-1);
  const scrollArrowRef = React.useRef<HTMLDivElement | null>(null);
  const mergedRef = useForkRef(forwardedRef, scrollArrowRef);

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

  const getScrollArrowProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps<'div'>(
        {
          'aria-hidden': true,
          children: direction === 'down' ? '▼' : '▲',
          style: {
            position: 'absolute',
          },
          onMouseEnter() {
            if (!alignItemToTrigger) {
              return;
            }

            let prevNow = Date.now();

            function handleFrame() {
              const popupElement = popupRef.current;
              if (!popupElement) {
                return;
              }

              const currentNow = Date.now();
              const msElapsed = currentNow - prevNow;
              prevNow = currentNow;

              const pixelsLeftToScroll =
                direction === 'up'
                  ? popupElement.scrollTop
                  : popupElement.scrollHeight - popupElement.clientHeight - popupElement.scrollTop;
              const pixelsToScroll = Math.min(pixelsLeftToScroll, msElapsed / 2);

              const isScrolledToTop = popupElement.scrollTop === 0;
              const isScrolledToBottom =
                Math.round(popupElement.scrollTop + popupElement.clientHeight) >=
                popupElement.scrollHeight;

              if (msElapsed > 0) {
                if (direction === 'up') {
                  setScrollUpArrowVisible(!isScrolledToTop);
                } else if (direction === 'down') {
                  setScrollDownArrowVisible(!isScrolledToBottom);
                }

                if (
                  (direction === 'up' && isScrolledToTop) ||
                  (direction === 'down' && isScrolledToBottom)
                ) {
                  return;
                }
              }

              const scrollDirection = direction === 'up' ? -1 : 1;

              if (popupRef.current) {
                popupRef.current.scrollTop += scrollDirection * pixelsToScroll;
              }

              frameRef.current = requestAnimationFrame(handleFrame);
            }

            frameRef.current = requestAnimationFrame(handleFrame);
          },
          onMouseLeave() {
            cancelAnimationFrame(frameRef.current);
          },
        },
        externalProps,
      ),
    [direction, alignItemToTrigger, popupRef, setScrollUpArrowVisible, setScrollDownArrowVisible],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getScrollArrowProps,
    ref: mergedRef,
    render: render ?? 'div',
    className,
    state,
    extraProps: {
      hidden: !mounted,
      ...otherProps,
    },
  });

  const shouldRender = visible || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace SelectScrollArrow {
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

SelectScrollArrow.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  direction: PropTypes.oneOf(['down', 'up']).isRequired,
  /**
   * Whether to keep the HTML element in the DOM while the select menu is not scrollable.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectScrollArrow };
