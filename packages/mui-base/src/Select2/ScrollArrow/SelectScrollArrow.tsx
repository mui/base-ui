'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useEventCallback } from '../../utils/useEventCallback';
import { ownerWindow } from '../../utils/owner';
import { MAX_Z_INDEX } from '../../utils/constants';

/**
 * @ignore - internal component.
 */
const SelectScrollArrow = React.forwardRef(function SelectScrollArrow(
  props: SelectScrollArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, direction, keepMounted = false, ...otherProps } = props;

  const { open, alignOptionToTrigger, popupRef } = useSelectRootContext();

  const [visible, setVisible] = React.useState(false);

  if (visible && !alignOptionToTrigger) {
    setVisible(false);
  }

  const frameRef = React.useRef(-1);

  const ownerState: SelectScrollArrow.OwnerState = React.useMemo(
    () => ({
      direction,
      visible,
    }),
    [direction, visible],
  );

  const getScrollArrowProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        'aria-hidden': true,
        children: direction === 'down' ? '▼' : '▲',
        style: {
          position: 'absolute',
          zIndex: MAX_Z_INDEX,
        },
        onMouseEnter() {
          if (!alignOptionToTrigger) {
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
                setVisible(!isScrolledToTop);
              } else if (direction === 'down') {
                setVisible(!isScrolledToBottom);
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

          requestAnimationFrame(handleFrame);
        },
        onMouseLeave() {
          cancelAnimationFrame(frameRef.current);
        },
      }),
    [direction, popupRef, alignOptionToTrigger],
  );

  const handleScrollArrowVisible = useEventCallback(() => {
    const popupElement = popupRef.current;
    if (!popupElement) {
      return;
    }

    if (direction === 'up') {
      setVisible(popupElement.scrollTop > 1);
    } else if (direction === 'down') {
      const isScrolledToBottom =
        Math.ceil(popupElement.scrollTop + popupElement.clientHeight) >=
        popupElement.scrollHeight - 1;
      setVisible(!isScrolledToBottom);
    }
  });

  React.useEffect(() => {
    const popupElement = popupRef.current;
    if (!popupElement || !alignOptionToTrigger) {
      return undefined;
    }

    const win = ownerWindow(popupElement);

    popupElement.addEventListener('wheel', handleScrollArrowVisible);
    popupElement.addEventListener('scroll', handleScrollArrowVisible);
    win.addEventListener('resize', handleScrollArrowVisible);
    win.addEventListener('scroll', handleScrollArrowVisible);

    return () => {
      popupElement.removeEventListener('wheel', handleScrollArrowVisible);
      popupElement.removeEventListener('scroll', handleScrollArrowVisible);
      win.removeEventListener('resize', handleScrollArrowVisible);
      win.removeEventListener('scroll', handleScrollArrowVisible);
    };
  }, [alignOptionToTrigger, popupRef, direction, handleScrollArrowVisible]);

  useEnhancedEffect(() => {
    if (!open || !alignOptionToTrigger) {
      return;
    }

    handleScrollArrowVisible();
  }, [open, alignOptionToTrigger, handleScrollArrowVisible]);

  const { renderElement } = useComponentRenderer({
    propGetter: getScrollArrowProps,
    ref: forwardedRef,
    render: render ?? 'div',
    className,
    ownerState,
    extraProps: otherProps,
  });

  const shouldRender = visible || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace SelectScrollArrow {
  export interface OwnerState {
    direction: 'up' | 'down';
    visible: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    direction: 'up' | 'down';
    /**
     * Whether the component should be kept mounted when it is not rendered.
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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  direction: PropTypes.oneOf(['down', 'up']).isRequired,
  /**
   * Whether the component should be kept mounted when it is not rendered.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectScrollArrow };
