'use client';
import * as React from 'react';
import { contains, getTarget, stopEvent } from '../../floating-ui-react/utils';
import type { BaseUIComponentProps } from '../../utils/types';
import { useEventCallback } from '../../utils/useEventCallback';
import { useContextMenuRootContext } from '../root/ContextMenuRootContext';
import { ownerDocument } from '../../utils/owner';
import { useRenderElement } from '../../utils/useRenderElement';
import { useTimeout } from '../../utils/useTimeout';

const LONG_PRESS_DELAY = 500;

/**
 * An area that opens the menu on right click or long press.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Context Menu](https://base-ui.com/react/components/context-menu)
 */
export const ContextMenuTrigger = React.forwardRef(function ContextMenuTrigger(
  componentProps: ContextMenuTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const {
    setAnchor,
    actionsRef,
    internalBackdropRef,
    backdropRef,
    positionerRef,
    allowMouseUpTriggerRef,
  } = useContextMenuRootContext(false);

  const triggerRef = React.useRef<HTMLDivElement | null>(null);
  const touchPositionRef = React.useRef<{ x: number; y: number } | null>(null);
  const longPressTimeout = useTimeout();
  const allowMouseUpTimeout = useTimeout();
  const allowMouseUpRef = React.useRef(false);

  const handleLongPress = useEventCallback((x: number, y: number, event: Event) => {
    const isTouchEvent = event.type.startsWith('touch');

    setAnchor({
      getBoundingClientRect() {
        return DOMRect.fromRect({
          width: isTouchEvent ? 10 : 0,
          height: isTouchEvent ? 10 : 0,
          x,
          y,
        });
      },
    });

    allowMouseUpRef.current = false;
    actionsRef.current?.setOpen(true, event);

    allowMouseUpTimeout.start(LONG_PRESS_DELAY, () => {
      allowMouseUpRef.current = true;
    });
  });

  const handleContextMenu = useEventCallback((event: React.MouseEvent) => {
    allowMouseUpTriggerRef.current = true;
    stopEvent(event);
    handleLongPress(event.clientX, event.clientY, event.nativeEvent);
    const doc = ownerDocument(triggerRef.current);

    doc.addEventListener(
      'mouseup',
      (mouseEvent: MouseEvent) => {
        allowMouseUpTriggerRef.current = false;

        if (!allowMouseUpRef.current) {
          return;
        }

        allowMouseUpTimeout.clear();
        allowMouseUpRef.current = false;

        if (contains(positionerRef.current, getTarget(mouseEvent) as Element | null)) {
          return;
        }

        actionsRef.current?.setOpen(false, mouseEvent, 'cancel-open');
      },
      { once: true },
    );
  });

  const handleTouchStart = useEventCallback((event: React.TouchEvent) => {
    allowMouseUpTriggerRef.current = false;
    if (event.touches.length === 1) {
      event.stopPropagation();
      const touch = event.touches[0];
      touchPositionRef.current = { x: touch.clientX, y: touch.clientY };
      longPressTimeout.start(LONG_PRESS_DELAY, () => {
        if (touchPositionRef.current) {
          handleLongPress(
            touchPositionRef.current.x,
            touchPositionRef.current.y,
            event.nativeEvent,
          );
        }
      });
    }
  });

  const handleTouchMove = useEventCallback((event: React.TouchEvent) => {
    if (longPressTimeout.isStarted() && touchPositionRef.current && event.touches.length === 1) {
      const touch = event.touches[0];
      const moveThreshold = 10;

      const deltaX = Math.abs(touch.clientX - touchPositionRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchPositionRef.current.y);

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        longPressTimeout.clear();
      }
    }
  });

  const handleTouchEnd = useEventCallback(() => {
    longPressTimeout.clear();
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

  const element = useRenderElement('div', componentProps, {
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

  return element;
});

export namespace ContextMenuTrigger {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
