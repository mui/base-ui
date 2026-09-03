'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { ownerDocument } from '@base-ui/utils/owner';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { contains, getTarget, stopEvent } from '../../floating-ui-react/utils';
import type { BaseUIComponentProps } from '../../internals/types';
import { useContextMenuRootContext } from '../root/ContextMenuRootContext';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { useRenderElement } from '../../internals/useRenderElement';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { REASONS } from '../../internals/reasons';
import { findRootOwnerId } from '../../menu/utils/findRootOwnerId';

const LONG_PRESS_DELAY = 500;

/**
 * Whether a `contextmenu` event was raised by the keyboard (Shift+F10 / the Menu key)
 * rather than a pointer. Chromium dispatches `contextmenu` as a `PointerEvent`, so an
 * empty `pointerType` is a reliable keyboard signal; Firefox and Safari dispatch a plain
 * `MouseEvent`, where a keyboard activation reports the primary button and no coordinates.
 */
function isKeyboardContextMenu(event: MouseEvent): boolean {
  const { pointerType } = event as PointerEvent;
  if (pointerType != null) {
    return pointerType === '';
  }
  return event.button === 0 && event.clientX === 0 && event.clientY === 0;
}

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
  const allowMouseUpTimeout = useTimeout();
  const allowMouseUpRef = React.useRef(false);
  const mouseUpAbortControllerRef = React.useRef<AbortController | null>(null);

  function handleLongPress(
    x: number,
    y: number,
    event: MouseEvent | TouchEvent,
    keyboardActivation = false,
  ) {
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

    allowMouseUpRef.current = false;
    actionsRef.current?.setOpen(
      true,
      createChangeEventDetails(REASONS.triggerPress, event, undefined, {
        // A pointer or touch gesture opened the menu, so its enter transition should play;
        // only a keyboard `contextmenu` (Shift+F10 / the Menu key) opens instantly.
        instantType: !isTouchEvent && keyboardActivation ? 'click' : undefined,
      }),
    );

    allowMouseUpTimeout.start(LONG_PRESS_DELAY, () => {
      allowMouseUpRef.current = true;
    });
  }

  function handleContextMenu(event: React.MouseEvent) {
    if (disabled) {
      return;
    }
    allowMouseUpTriggerRef.current = true;
    stopEvent(event);
    // A long-press on Android also surfaces here as a native `contextmenu`; a pending touch
    // gesture recorded by `handleTouchStart` marks this open as pointer-driven, not keyboard.
    const keyboardActivation =
      touchPositionRef.current == null && isKeyboardContextMenu(event.nativeEvent);
    handleLongPress(event.clientX, event.clientY, event.nativeEvent, keyboardActivation);
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
    function handleDocumentContextMenu(event: MouseEvent) {
      if (disabled) {
        return;
      }

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
    return addEventListener(doc, 'contextmenu', handleDocumentContextMenu);
  }, [backdropRef, disabled, internalBackdropRef]);

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
