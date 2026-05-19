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
  const pointerPositionRef = React.useRef<{ id: number; x: number; y: number } | null>(null);
  const longPressTimeout = useTimeout();
  const allowMouseUpTimeout = useTimeout();
  const allowMouseUpRef = React.useRef(false);

  function handleLongPress(event: MouseEvent | PointerEvent) {
    const isTouchLike =
      'pointerType' in event && (event.pointerType === 'touch' || event.pointerType === 'pen');
    const x = event.clientX;
    const y = event.clientY;

    initialCursorPointRef.current = { x, y };

    setAnchor({
      getBoundingClientRect() {
        return DOMRect.fromRect({
          width: isTouchLike ? 10 : 0,
          height: isTouchLike ? 10 : 0,
          x,
          y,
        });
      },
    });

    allowMouseUpRef.current = false;
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
    handleLongPress(event.nativeEvent);
    const doc = ownerDocument(triggerRef.current);

    addEventListener(
      doc,
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
      { once: true },
    );
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') {
      return;
    }
    if (!event.isPrimary) {
      return;
    }

    allowMouseUpTriggerRef.current = false;
    event.stopPropagation();

    pointerPositionRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);

    longPressTimeout.start(LONG_PRESS_DELAY, () => {
      if (pointerPositionRef.current) {
        handleLongPress(event.nativeEvent);
      }
    });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const active = pointerPositionRef.current;
    if (!active || event.pointerId !== active.id) {
      return;
    }
    if (!longPressTimeout.isStarted()) {
      return;
    }

    const moveThreshold = 10;
    const deltaX = Math.abs(event.clientX - active.x);
    const deltaY = Math.abs(event.clientY - active.y);

    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      longPressTimeout.clear();
    }
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    const active = pointerPositionRef.current;
    if (active && event.pointerId !== active.id) {
      return;
    }
    longPressTimeout.clear();
    pointerPositionRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

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
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerEnd,
        onPointerCancel: handlePointerEnd,
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
