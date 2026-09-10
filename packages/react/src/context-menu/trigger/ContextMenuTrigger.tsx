'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { ownerDocument } from '@base-ui/utils/owner';
import { useTimeout } from '@base-ui/utils/useTimeout';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
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
const SECONDARY_BUTTON = 2;

/**
 * Whether a `contextmenu` event was raised by the keyboard (Shift+F10 / the Menu key) rather
 * than a pointer.
 *
 * The event's own shape cannot answer this. `detail` is `0` for every source; the coordinates are
 * the focused element's box on a keyboard activation, so they look like a click's; and while
 * Chromium dispatches `contextmenu` as a `PointerEvent`, it reports `pointerType: 'mouse'` for
 * keyboard activations too, so that field does not discriminate either. Do not reintroduce a
 * check on any of them.
 *
 * What does hold, measured in Chromium and consistent with how the events are specified, is the
 * order of what precedes the event:
 *
 * - right-click: `pointerdown` on the trigger, then `contextmenu` with the secondary button;
 * - Shift+F10 / Menu key: `keydown` on the trigger, then `contextmenu` with no pointer gesture
 *   in flight (Chromium reports `button === -1`, Gecko and WebKit the primary button);
 * - touch long press: `pointerdown` with `pointerType: 'touch'`, then `contextmenu`;
 * - macOS Ctrl+click: the modifier's `keydown`, then `pointerdown`, then `contextmenu` — the
 *   `pointerdown` lands last, so the gesture is recorded again after the key press cleared it.
 *
 * So the secondary button is a positive pointer signal on its own, and otherwise the question is
 * whether a pointer gesture is in flight. That recording is best-effort — it is taken in the
 * capture phase so a descendant cannot suppress it, but it is still the weaker of the two.
 */
function isKeyboardContextMenu(event: MouseEvent, lastPointerType: InteractionType): boolean {
  if (event.button === SECONDARY_BUTTON) {
    return false;
  }
  return lastPointerType === '';
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
    openInstantTypeRef,
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
  // The pointer gesture currently in flight, used to tell a pointer-driven `contextmenu` from a
  // keyboard one. A key press always precedes a keyboard `contextmenu`, so it ends any gesture
  // recorded here.
  const lastPointerTypeRef = React.useRef<InteractionType>('');

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
    // A pointer or touch gesture opened the menu, so its enter transition should play; only a
    // keyboard `contextmenu` (Shift+F10 / the Menu key) opens instantly. `MenuRoot` reads this
    // while handling the `setOpen` below.
    openInstantTypeRef.current = keyboardActivation ? 'click' : undefined;
    actionsRef.current?.setOpen(true, createChangeEventDetails(REASONS.triggerPress, event));

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
    handleLongPress(
      event.clientX,
      event.clientY,
      event.nativeEvent,
      isKeyboardContextMenu(event.nativeEvent, lastPointerTypeRef.current),
    );
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

  function handlePointerDown(event: React.PointerEvent) {
    lastPointerTypeRef.current = event.pointerType as InteractionType;
  }

  function handleKeyDown() {
    // Shift+F10 and the Menu key raise their `contextmenu` from this key press, so any pointer
    // gesture recorded earlier is over and must not be mistaken for the one that opened the menu.
    lastPointerTypeRef.current = '';
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
        // Capture phase so a descendant that stops propagation cannot hide the gesture from the
        // classification in `handleContextMenu`.
        onPointerDownCapture: handlePointerDown,
        onKeyDownCapture: handleKeyDown,
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
