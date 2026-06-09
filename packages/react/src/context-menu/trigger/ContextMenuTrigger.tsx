'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
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
  const suppressReopenRef = React.useRef(false);
  const openedWithTouchRef = React.useRef(false);
  const longPressTimeout = useTimeout();

  // Whether a repeat right click at this point should toggle the menu closed: within
  // the threshold box around the opening point, but never over the popup itself,
  // whose edge sits closer to the cursor than the threshold (2px by default, and on
  // varying sides depending on the rendered position). Right-clicking the popup
  // surface is not a toggle gesture. A 0.5px overlap is tolerated for borderline
  // clicks at the very edge.
  const isWithinToggleArea = useStableCallback((x: number, y: number) => {
    const initialCursorPoint = initialCursorPointRef.current;
    if (
      !initialCursorPoint ||
      Math.abs(x - initialCursorPoint.x) > CONTEXT_MENU_MOVE_THRESHOLD ||
      Math.abs(y - initialCursorPoint.y) > CONTEXT_MENU_MOVE_THRESHOLD
    ) {
      return false;
    }

    const positioner = positionerRef.current;
    if (positioner) {
      const rect = positioner.getBoundingClientRect();
      if (
        x > rect.left + 0.5 &&
        x < rect.right - 0.5 &&
        y > rect.top + 0.5 &&
        y < rect.bottom - 0.5
      ) {
        return false;
      }
    }

    return true;
  });

  function handleLongPress(rawX: number, rawY: number, event: MouseEvent | TouchEvent) {
    const isTouchEvent = event.type.startsWith('touch');

    // The event coordinates are precise floats, but the system draws the cursor at
    // the floored device pixel. Snap the anchor to that grid so the popup sits at an
    // exact distance from the visible cursor instead of drifting by up to a pixel.
    const dpr = ownerWindow(triggerRef.current).devicePixelRatio || 1;
    const x = Math.floor(rawX * dpr) / dpr;
    const y = Math.floor(rawY * dpr) / dpr;

    initialCursorPointRef.current = { x, y };
    openedWithTouchRef.current = isTouchEvent;

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

    // The right click that just dismissed the menu (its `pointerdown` triggered
    // outside-press while within the box around the opening point) bubbles a
    // `contextmenu` event to the trigger once the backdrop unmounts. Suppress it so
    // right-clicking in place toggles the menu closed instead of reopening it.
    if (suppressReopenRef.current) {
      suppressReopenRef.current = false;
      stopEvent(event);
      return;
    }

    allowMouseUpTriggerRef.current = true;
    stopEvent(event);
    handleLongPress(event.clientX, event.clientY, event.nativeEvent);
    const doc = ownerDocument(triggerRef.current);

    // Abort a listener from a previous trigger that never saw its mouseup, and scope this
    // one to a fresh controller so it's removed on unmount if the mouseup never arrives.
    mouseUpAbortControllerRef.current?.abort();
    const mouseUpAbortController = new AbortController();
    mouseUpAbortControllerRef.current = mouseUpAbortController;
    doc.addEventListener(
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
      { once: true, signal: mouseUpAbortController.signal },
    );
  }

  function cancelLongPress() {
    longPressTimeout.clear();
    touchPositionRef.current = null;
  }

  function handleTouchStart(event: React.TouchEvent) {
    if (disabled) {
      cancelLongPress();
      return;
    }
    allowMouseUpTriggerRef.current = false;
    if (event.touches.length !== 1) {
      cancelLongPress();
      return;
    }

    event.stopPropagation();
    const touch = event.touches[0];
    const touchPosition = { x: touch.clientX, y: touch.clientY };
    touchPositionRef.current = touchPosition;
    longPressTimeout.start(LONG_PRESS_DELAY, () => {
      handleLongPress(touchPosition.x, touchPosition.y, event.nativeEvent);
    });
  }

  function handleTouchMove(event: React.TouchEvent) {
    if (event.touches.length !== 1) {
      cancelLongPress();
      return;
    }

    if (longPressTimeout.isStarted() && touchPositionRef.current) {
      const touch = event.touches[0];
      const moveThreshold = 10;

      const deltaX = Math.abs(touch.clientX - touchPositionRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchPositionRef.current.y);

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        cancelLongPress();
      }
    }
  }

  React.useEffect(
    () => () => {
      // Abort a pending mouseup listener if the trigger unmounts before it fires.
      mouseUpAbortControllerRef.current?.abort();
    },
    [],
  );

  // While the menu is open, watch for the right click that dismisses it: its
  // `pointerdown` closes the menu through outside-press before the `contextmenu`
  // event fires. When that press is within the box around the opening point, flag
  // it so `handleContextMenu` doesn't immediately reopen the menu.
  React.useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.button !== 2) {
        return;
      }
      if (isWithinToggleArea(event.clientX, event.clientY)) {
        suppressReopenRef.current = true;
      }
    }

    const doc = ownerDocument(triggerRef.current);
    return addEventListener(doc, 'pointerdown', handlePointerDown, { capture: true });
  }, [open, isWithinToggleArea]);

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
      // The popup can sit directly under the cursor (negative side offset), in which
      // case the re-click's `pointerdown` is an inside press that doesn't dismiss
      // the menu and the `contextmenu` event lands on the popup itself.
      const onOpenMenu = onBackdrop || contains(positionerRef.current, targetElement);

      if (contains(triggerRef.current, targetElement) || onBackdrop) {
        event.preventDefault();
      }

      // Right-clicking again within the toggle area around the point the menu was
      // opened at toggles it closed. Skipped when the menu was opened by a touch
      // long press: the browser fires its own `contextmenu` event after the menu has
      // already opened under the finger, which would immediately close it again.
      if (
        onOpenMenu &&
        !openedWithTouchRef.current &&
        isWithinToggleArea(event.clientX, event.clientY)
      ) {
        event.preventDefault();
        actionsRef.current?.setOpen(false, createChangeEventDetails(REASONS.triggerPress, event));
      }

      // This listener runs after the trigger's own `contextmenu` handler, so any
      // unconsumed suppress flag (e.g. the re-click landed on the popup instead of
      // the trigger) is stale at this point.
      suppressReopenRef.current = false;
    }

    const doc = ownerDocument(triggerRef.current);
    return addEventListener(doc, 'contextmenu', handleDocumentContextMenu);
  }, [actionsRef, backdropRef, disabled, internalBackdropRef, isWithinToggleArea, positionerRef]);

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
        onTouchEnd: cancelLongPress,
        onTouchCancel: cancelLongPress,
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
