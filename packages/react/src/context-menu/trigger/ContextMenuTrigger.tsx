'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { contains, getTarget, stopEvent } from '../../floating-ui-react/utils';
import type { BaseUIComponentProps } from '../../internals/types';
import { useContextMenuRootContext } from '../root/ContextMenuRootContext';
import { CONTEXT_MENU_MOVE_THRESHOLD, isWithinThreshold } from '../utils/constants';
import { PATIENT_CLICK_THRESHOLD } from '../../internals/constants';
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
  const pressTimeStampRef = React.useRef(0);
  const mouseUpAbortControllerRef = React.useRef<AbortController | null>(null);

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

    // A right click while another mouse button is already held down is part of a
    // chorded gesture (e.g. a left-drag plus right click), not a context menu
    // request. `buttons` is 2 while only the right button is held, or 0 on
    // platforms where `contextmenu` fires on its release.
    const { buttons } = event.nativeEvent;
    if (buttons !== 0 && buttons !== 2) {
      event.preventDefault();
      return;
    }

    allowMouseUpTriggerRef.current = true;
    stopEvent(event);
    handleLongPress(event.clientX, event.clientY, event.nativeEvent);

    // Marks when the opening press started, so the release can tell a fast opening
    // click from a patient in-place hold that should dismiss the menu. Touch never
    // dismisses this way: the browser fires `contextmenu` mid-press by design.
    pressTimeStampRef.current =
      (event.nativeEvent as PointerEvent).pointerType === 'touch' ? Infinity : event.timeStamp;

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

        const mouseUpTarget = getTarget(mouseEvent) as Element | null;

        // Ignore the `mouseup` that completes the right click itself: while the
        // cursor stays within the box around the opening point, this release is
        // part of the opening gesture and must not close the menu. Moving outside
        // the box turns it into a press-drag-release that can dismiss the menu,
        // and a press held in place past the patient-click threshold turns the
        // release into a deliberate dismiss — unless it lands on the popup
        // surface, where it must still be able to activate an item.
        if (
          isWithinThreshold(
            initialCursorPointRef.current,
            mouseEvent.clientX,
            mouseEvent.clientY,
            CONTEXT_MENU_MOVE_THRESHOLD,
          ) &&
          mouseEvent.timeStamp - pressTimeStampRef.current < PATIENT_CLICK_THRESHOLD
        ) {
          return;
        }

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

  React.useEffect(() => {
    // While the menu is open, watch for the right click that dismisses it: its
    // `pointerdown` closes the menu through outside-press before the `contextmenu`
    // event fires. When that press is within the box around the opening point — but
    // not on the popup itself, where right-clicking is not a toggle gesture — flag
    // it so `handleContextMenu` doesn't immediately reopen the menu.
    function handleDocumentPointerDown(event: PointerEvent) {
      if (event.button !== 2 || !store.select('open')) {
        return;
      }
      if (
        isWithinThreshold(
          initialCursorPointRef.current,
          event.clientX,
          event.clientY,
          CONTEXT_MENU_MOVE_THRESHOLD,
        ) &&
        !contains(positionerRef.current, getTarget(event) as Element | null)
      ) {
        suppressReopenRef.current = true;
      }
    }

    function handleDocumentContextMenu(event: MouseEvent) {
      if (disabled) {
        return;
      }

      const target = getTarget(event);
      const targetElement = target as HTMLElement | null;
      const onBackdrop =
        contains(internalBackdropRef.current, targetElement) ||
        contains(backdropRef.current, targetElement);

      if (onBackdrop || contains(triggerRef.current, targetElement)) {
        event.preventDefault();
      }

      // Right-clicking again within the toggle box around the point the menu was
      // opened at toggles it closed. Only backdrop clicks toggle: the popup can sit
      // directly under the cursor (negative side offset), and right-clicking the
      // popup surface is not a toggle gesture. Skipped when the menu was opened by
      // a touch long press: the browser fires its own `contextmenu` event after the
      // menu has already opened under the finger, which would immediately close it
      // again.
      if (
        !openedWithTouchRef.current &&
        onBackdrop &&
        isWithinThreshold(
          initialCursorPointRef.current,
          event.clientX,
          event.clientY,
          CONTEXT_MENU_MOVE_THRESHOLD,
        )
      ) {
        actionsRef.current?.setOpen(false, createChangeEventDetails(REASONS.triggerPress, event));
      }

      // This listener runs after the trigger's own `contextmenu` handler, so any
      // unconsumed suppress flag (e.g. the re-click landed on the popup instead of
      // the trigger) is stale at this point.
      suppressReopenRef.current = false;
    }

    const doc = ownerDocument(triggerRef.current);
    const removePointerDown = addEventListener(doc, 'pointerdown', handleDocumentPointerDown, {
      capture: true,
    });
    const removeContextMenu = addEventListener(doc, 'contextmenu', handleDocumentContextMenu);
    return () => {
      removePointerDown();
      removeContextMenu();
    };
  }, [
    actionsRef,
    backdropRef,
    disabled,
    internalBackdropRef,
    initialCursorPointRef,
    positionerRef,
    store,
  ]);

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
