'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { ownerDocument } from '@base-ui/utils/owner';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { contains, getTarget, stopEvent } from '../../floating-ui-react/utils';
import type { BaseUIComponentProps } from '../../internals/types';
import { useContextMenuRootContext } from '../root/ContextMenuRootContext';
import { CONTEXT_MENU_MOVE_THRESHOLD } from '../utils/constants';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { useRenderElement } from '../../internals/useRenderElement';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { REASONS } from '../../internals/reasons';
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
  const { render, className, style, ...elementProps } = componentProps;

  const {
    setAnchor,
    actionsRef,
    internalBackdropRef,
    backdropRef,
    positionerRef,
    allowMouseUpTriggerRef,
    initialCursorPointRef,
    rootId,
  } = useContextMenuRootContext(false);

  const { store } = useMenuRootContext(false);
  const open = store.useState('open');
  const disabled = store.useState('disabled');

  const triggerRef = React.useRef<HTMLDivElement | null>(null);
  const touchPositionRef = React.useRef<{ x: number; y: number } | null>(null);
  const longPressTimeout = useTimeout();

  function handleLongPress(x: number, y: number, event: MouseEvent | TouchEvent) {
    const isTouchEvent = event.type.startsWith('touch');

    initialCursorPointRef.current = { x, y };

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

    actionsRef.current?.setOpen(true, createChangeEventDetails(REASONS.triggerPress, event));
  }

  function handleContextMenu(event: React.MouseEvent) {
    if (disabled) {
      return;
    }
    allowMouseUpTriggerRef.current = true;
    stopEvent(event);
    handleLongPress(event.clientX, event.clientY, event.nativeEvent);
    const doc = ownerDocument(triggerRef.current);

    addEventListener(
      doc,
      'mouseup',
      (mouseEvent) => {
        allowMouseUpTriggerRef.current = false;

        // Ignore the `mouseup` that completes the right click itself: while the
        // cursor stays within the box around the opening point, this release is
        // part of the opening gesture and must not close the menu. Moving outside
        // the box turns it into a press-drag-release that can dismiss the menu.
        const initialCursorPoint = initialCursorPointRef.current;
        if (
          initialCursorPoint &&
          Math.abs(mouseEvent.clientX - initialCursorPoint.x) <= CONTEXT_MENU_MOVE_THRESHOLD &&
          Math.abs(mouseEvent.clientY - initialCursorPoint.y) <= CONTEXT_MENU_MOVE_THRESHOLD
        ) {
          return;
        }

        const mouseUpTarget = getTarget(mouseEvent) as Element | null;

        if (contains(positionerRef.current, mouseUpTarget)) {
          return;
        }

        if (rootId && mouseUpTarget && findRootOwnerId(mouseUpTarget) === rootId) {
          return;
        }

        actionsRef.current?.setOpen(
          false,
          createChangeEventDetails(REASONS.cancelOpen, mouseEvent),
        );
      },
      { once: true },
    );
  }

  function handleTouchStart(event: React.TouchEvent) {
    if (disabled) {
      return;
    }
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
  }

  function handleTouchMove(event: React.TouchEvent) {
    if (longPressTimeout.isStarted() && touchPositionRef.current && event.touches.length === 1) {
      const touch = event.touches[0];
      const moveThreshold = 10;

      const deltaX = Math.abs(touch.clientX - touchPositionRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchPositionRef.current.y);

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        longPressTimeout.clear();
      }
    }
  }

  function handleTouchEnd() {
    longPressTimeout.clear();
    touchPositionRef.current = null;
  }

  React.useEffect(() => {
    function handleDocumentContextMenu(event: MouseEvent) {
      if (disabled) {
        return;
      }

      const target = getTarget(event);
      const targetElement = target as HTMLElement | null;
      const onBackdrop =
        contains(internalBackdropRef.current, targetElement) ||
        contains(backdropRef.current, targetElement);

      if (contains(triggerRef.current, targetElement) || onBackdrop) {
        event.preventDefault();
      }

      // While the menu is open its modal backdrop covers the trigger, so a second
      // right click lands on the backdrop. Right-clicking again within the box
      // around the point the menu was opened at toggles it closed.
      if (onBackdrop) {
        const initialCursorPoint = initialCursorPointRef.current;
        if (
          initialCursorPoint &&
          Math.abs(event.clientX - initialCursorPoint.x) <= CONTEXT_MENU_MOVE_THRESHOLD &&
          Math.abs(event.clientY - initialCursorPoint.y) <= CONTEXT_MENU_MOVE_THRESHOLD
        ) {
          actionsRef.current?.setOpen(false, createChangeEventDetails(REASONS.triggerPress, event));
        }
      }
    }

    const doc = ownerDocument(triggerRef.current);
    return addEventListener(doc, 'contextmenu', handleDocumentContextMenu);
  }, [actionsRef, backdropRef, disabled, initialCursorPointRef, internalBackdropRef]);

  const state: ContextMenuTriggerState = {
    open,
  };

  const element = useRenderElement('div', componentProps, {
    state,
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
    stateAttributesMapping: pressableTriggerOpenStateMapping,
  });

  return element;
});

export interface ContextMenuTriggerState {
  /**
   * Whether the context menu is currently open.
   */
  open: boolean;
}

export interface ContextMenuTriggerProps extends BaseUIComponentProps<
  'div',
  ContextMenuTriggerState
> {}

export namespace ContextMenuTrigger {
  export type State = ContextMenuTriggerState;
  export type Props = ContextMenuTriggerProps;
}
