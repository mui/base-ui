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

  const [rendered, setRendered] = React.useState(false);

  const inert = alignMethod === 'trigger' || touchModality;

  if (rendered && inert) {
    setRendered(false);
  }

  const frameRef = React.useRef(-1);

  const ownerState: SelectScrollArrow.OwnerState = React.useMemo(
    () => ({
      direction,
      rendered,
      side,
    }),
    [direction, rendered, side],
  );

  const getScrollArrowProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        'aria-hidden': true,
        children: '▼',
        style: {
          position: 'absolute',
          zIndex: 2147483647, // max z-index
        },
        onMouseEnter() {
          if (inert) {
            return;
          }

          let prevNow = Date.now();

          function handleFrame() {
            if (!popupRef.current) {
              return;
            }

            const currentNow = Date.now();
            const msElapsed = currentNow - prevNow;
            prevNow = currentNow;

            const pixelsToScroll = Math.floor(
              Math.min(
                msElapsed / 2,
                popupRef.current.scrollHeight - popupRef.current.clientHeight,
              ) || 1,
            );

            const isScrolledToTop = popupRef.current.scrollTop === 0;
            const isScrolledToBottom =
              Math.ceil(popupRef.current.scrollTop + popupRef.current.clientHeight) >=
              popupRef.current.scrollHeight;

            if (msElapsed > 0) {
              if (direction === 'up') {
                setRendered(!isScrolledToTop);
              } else if (direction === 'down') {
                setRendered(!isScrolledToBottom);
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

  const handleScrollArrowRendered = useEventCallback(() => {
    const popupElement = popupRef.current;
    if (!popupElement) {
      return;
    }

    if (direction === 'up') {
      setRendered(popupElement.scrollTop > 1);
    } else if (direction === 'down') {
      const isScrolledToBottom =
        Math.ceil(popupElement.scrollTop + popupElement.clientHeight) >=
        popupElement.scrollHeight - 1;
      setRendered(!isScrolledToBottom);
    }
  });

  React.useEffect(() => {
    const popupElement = popupRef.current;
    if (!popupElement || inert) {
      return undefined;
    }

    const win = ownerWindow(popupElement);

    popupElement.addEventListener('wheel', handleScrollArrowRendered);
    popupElement.addEventListener('scroll', handleScrollArrowRendered);
    win.addEventListener('resize', handleScrollArrowRendered);

    return () => {
      popupElement.removeEventListener('wheel', handleScrollArrowRendered);
      popupElement.removeEventListener('scroll', handleScrollArrowRendered);
      win.removeEventListener('resize', handleScrollArrowRendered);
    };
  }, [inert, popupRef, direction, handleScrollArrowRendered]);

  useEnhancedEffect(() => {
    if (!isPositioned || inert) {
      return;
    }

    handleScrollArrowRendered();
  }, [isPositioned, innerOffset, inert, handleScrollArrowRendered]);

  const { renderElement } = useComponentRenderer({
    propGetter: getScrollArrowProps,
    ref: forwardedRef,
    render: render ?? 'div',
    className,
    ownerState,
    extraProps: otherProps,
  });

  const shouldRender = rendered || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace SelectScrollArrow {
  export interface OwnerState {
    direction: 'up' | 'down';
    side: 'top' | 'right' | 'bottom' | 'left' | 'none';
    rendered: boolean;
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
