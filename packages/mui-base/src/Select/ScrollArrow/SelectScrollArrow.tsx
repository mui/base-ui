import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useSelectPositionerContext } from '../Positioner/SelectPositionerContext';
import { useEventCallback } from '../../utils/useEventCallback';
import { ownerWindow } from '../../utils/owner';
import { MAX_Z_INDEX } from '../../utils/floating';

/**
 * @ignore - internal component.
 */
const SelectScrollArrow = React.forwardRef(function SelectScrollArrow(
  props: SelectScrollArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, direction, keepMounted = false, ...otherProps } = props;

  const { alignMethod, innerOffset, setInnerOffset, innerFallback, popupRef, touchModality } =
    useSelectRootContext();
  const { isPositioned, side } = useSelectPositionerContext();

  const [visible, setVisible] = React.useState(false);

  const inert = alignMethod === 'trigger' || touchModality;

  if (visible && inert) {
    setVisible(false);
  }

  const frameRef = React.useRef(-1);

  const ownerState: SelectScrollArrow.OwnerState = React.useMemo(
    () => ({
      direction,
      visible,
      side,
    }),
    [direction, visible, side],
  );

  const getScrollArrowProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        'aria-hidden': true,
        children: direction === 'down' ? '▼' : '▲',
        style: {
          position: 'absolute',
          zIndex: MAX_Z_INDEX, // max z-index
        },
        onMouseEnter() {
          if (inert) {
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

            if (innerFallback) {
              setInnerOffset(0);
              popupRef.current.scrollTop += scrollDirection * pixelsToScroll;
            } else {
              setInnerOffset((o) => o + scrollDirection * pixelsToScroll);
            }

            frameRef.current = requestAnimationFrame(handleFrame);
          }

          requestAnimationFrame(handleFrame);
        },
        onMouseLeave() {
          cancelAnimationFrame(frameRef.current);
        },
      }),
    [direction, innerFallback, popupRef, setInnerOffset, inert],
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
    if (!popupElement || inert) {
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
  }, [inert, popupRef, direction, handleScrollArrowVisible]);

  useEnhancedEffect(() => {
    if (!isPositioned || inert) {
      return;
    }

    handleScrollArrowVisible();
  }, [isPositioned, side, inert, handleScrollArrowVisible]);

  useEnhancedEffect(() => {
    if (!isPositioned || inert) {
      return;
    }

    // Wait for the `innerOffset` to be applied in the DOM. While navigating with arrow keys, the
    // scroll arrow might render even though it doesn't need to be visible because the select's
    // height hasn't yet expanded.
    requestAnimationFrame(handleScrollArrowVisible);
  }, [isPositioned, inert, innerOffset, handleScrollArrowVisible]);

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
    side: 'top' | 'right' | 'bottom' | 'left' | 'none';
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
