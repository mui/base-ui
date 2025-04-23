'use client';
import * as React from 'react';
import { contains, getTarget } from '@floating-ui/react/utils';
import type { BaseUIComponentProps } from '../../utils/types';
import { useEventCallback } from '../../utils/useEventCallback';
import { useContextMenuRootContext } from '../root/ContextMenuRootContext';
import { ownerDocument } from '../../utils/owner';
import { useRenderElement } from '../../utils/useRenderElement';

const LONG_PRESS_DELAY = 500;

/**
 * An area that opens the menu on right click or long press.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Context Menu](https://base-ui.com/react/components/context-menu)
 */
const ContextMenuTrigger = React.forwardRef(function ContextMenuTrigger(
  componentProps: ContextMenuTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { setAnchor, actionsRef, internalBackdropRef, backdropRef } =
    useContextMenuRootContext(false);

  const triggerRef = React.useRef<HTMLDivElement | null>(null);
  const longPressTimerRef = React.useRef(-1);
  const touchPositionRef = React.useRef<{ x: number; y: number } | null>(null);

  const handleLongPress = useEventCallback((x: number, y: number, event: Event) => {
    setAnchor({
      getBoundingClientRect: () => {
        const isTouchEvent = event.type.startsWith('touch');
        return DOMRect.fromRect({
          width: isTouchEvent ? 10 : 0,
          height: isTouchEvent ? 10 : 0,
          x,
          y,
        });
      },
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
    function handleDocumentContextMenu(event: MouseEvent) {
      const target = getTarget(event);
      const targetElement = target as HTMLElement | null;
      if (
        contains(triggerRef.current, targetElement) ||
        contains(internalBackdropRef.current, targetElement) ||
        contains(backdropRef.current, targetElement)
      ) {
        event.preventDefault();
      }
    }

    const doc = ownerDocument(triggerRef.current);
    doc.addEventListener('contextmenu', handleDocumentContextMenu);
    return () => {
      doc.removeEventListener('contextmenu', handleDocumentContextMenu);
    };
  }, [backdropRef, internalBackdropRef]);

  React.useEffect(() => {
    return () => {
      if (longPressTimerRef.current !== -1) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const renderElement = useRenderElement('div', componentProps, {
    ref: [triggerRef, forwardedRef],
    props: [
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
      elementProps,
    ],
  });

  return renderElement();
});

namespace ContextMenuTrigger {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

export { ContextMenuTrigger };
