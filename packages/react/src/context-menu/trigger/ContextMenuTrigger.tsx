'use client';
import * as React from 'react';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { ownerDocument } from '@base-ui-components/utils/owner';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { contains, getTarget, stopEvent } from '../../floating-ui-react/utils';
import type { BaseUIComponentProps } from '../../utils/types';
import { useContextMenuRootContext } from '../root/ContextMenuRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { findRootOwnerId } from '../../menu/utils/findRootOwnerId';

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
    rootId,
  } = useContextMenuRootContext(false);

  const triggerRef = React.useRef<HTMLDivElement | null>(null);
  const touchPositionRef = React.useRef<{ x: number; y: number } | null>(null);
  const longPressTimeout = useTimeout();
  const allowMouseUpTimeout = useTimeout();
  const allowMouseUpRef = React.useRef(false);

  const handleLongPress = useEventCallback(
    (x: number, y: number, event: MouseEvent | TouchEvent) => {
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
      actionsRef.current?.setOpen(true, createChangeEventDetails('trigger-press', event));

      allowMouseUpTimeout.start(LONG_PRESS_DELAY, () => {
        allowMouseUpRef.current = true;
      });
    },
  );

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

        const mouseUpTarget = getTarget(mouseEvent) as Element | null;

        if (contains(positionerRef.current, mouseUpTarget)) {
          return;
        }

        if (rootId && mouseUpTarget && findRootOwnerId(mouseUpTarget) === rootId) {
          return;
        }

        actionsRef.current?.setOpen(false, createChangeEventDetails('cancel-open', mouseEvent));
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

export interface ContextMenuTriggerState {}

export interface ContextMenuTriggerProps
  extends BaseUIComponentProps<'div', ContextMenuTriggerState> {}

export namespace ContextMenuTrigger {
  export type State = ContextMenuTriggerState;
  export type Props = ContextMenuTriggerProps;
}
