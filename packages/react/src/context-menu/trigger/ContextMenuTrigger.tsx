'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEventCallback } from '../../utils/useEventCallback';
import { useContextMenuRootContext } from '../root/ContextMenuRootContext';
import { mergeProps } from '../../merge-props';

const LONG_PRESS_DELAY = 500;
const state = {};

/**
 * An area that opens the menu on right click or long press.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Context Menu](https://base-ui.com/react/components/context-menu)
 */
const ContextMenuTrigger = React.forwardRef(function ContextMenuTrigger(
  props: ContextMenuTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...other } = props;

  const { setAnchor, actionsRef } = useContextMenuRootContext(false);

  const longPressTimerRef = React.useRef(-1);
  const touchPositionRef = React.useRef<{ x: number; y: number } | null>(null);

  const handleLongPress = useEventCallback((x: number, y: number, event: Event) => {
    setAnchor({
      getBoundingClientRect: () => DOMRect.fromRect({ width: 0, height: 0, x, y }),
    });
    actionsRef.current?.setOpen(true, event);
  });

  const handleContextMenu = useEventCallback((event: React.MouseEvent) => {
    event.preventDefault();
    handleLongPress(event.clientX, event.clientY, event.nativeEvent);
  });

  const handleTouchStart = useEventCallback((event: React.TouchEvent) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      touchPositionRef.current = { x: touch.clientX, y: touch.clientY };

      // Prevent default to avoid text selection popup
      event.preventDefault();

      longPressTimerRef.current = window.setTimeout(() => {
        if (touchPositionRef.current) {
          handleLongPress(
            touchPositionRef.current.x,
            touchPositionRef.current.y,
            event.nativeEvent,
          );
        }
      }, LONG_PRESS_DELAY);
    }
  });

  const handleTouchMove = useEventCallback((event: React.TouchEvent) => {
    if (longPressTimerRef.current && touchPositionRef.current && event.touches.length === 1) {
      const touch = event.touches[0];
      const moveThreshold = 10;

      const deltaX = Math.abs(touch.clientX - touchPositionRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchPositionRef.current.y);

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = -1;
      }
    }
  });

  const handleTouchEnd = useEventCallback(() => {
    if (longPressTimerRef.current !== -1) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = -1;
    }
    touchPositionRef.current = null;
  });

  React.useEffect(() => {
    return () => {
      if (longPressTimerRef.current !== -1) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const getTriggerProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps<'div'>(
        {
          onContextMenu: handleContextMenu,
          onTouchStart: handleTouchStart,
          onTouchMove: handleTouchMove,
          onTouchEnd: handleTouchEnd,
          onTouchCancel: handleTouchEnd,
          style: {
            WebkitTouchCallout: 'none',
          },
        },
        externalProps,
      ),
    [handleContextMenu, handleTouchStart, handleTouchMove, handleTouchEnd],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getTriggerProps,
    render: render ?? 'div',
    ref: forwardedRef,
    className,
    state,
    extraProps: other,
  });

  return renderElement();
});

namespace ContextMenuTrigger {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

ContextMenuTrigger.propTypes /* remove-proptypes */ = {
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
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { ContextMenuTrigger };
