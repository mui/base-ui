import * as React from 'react';
import { isElement } from '@floating-ui/utils/dom';
import { useValueAsRef } from '@base-ui-components/utils/useValueAsRef';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';

import type { ElementProps, FloatingRootContext } from '../types';
import { contains, getDocument, isMouseLikePointerType } from '../utils';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import type { UseHoverProps } from './useHover';
import { getDelay } from './useHover';
import { useFloatingTree } from '../components/FloatingTree';
import {
  safePolygonIdentifier,
  useHoverInteractionSharedState,
} from './useHoverInteractionSharedState';

export interface UseHoverReferenceInteractionProps extends UseHoverProps {
  /**
   * Whether the hook controls the active trigger. When false, the props are
   * returned under the `trigger` key so they can be applied to inactive
   * triggers via `getTriggerProps`.
   * @default true
   */
  isActiveTrigger?: boolean;
}

function getRestMs(value: number | (() => number)) {
  if (typeof value === 'function') {
    return value();
  }
  return value;
}

/**
 * Provides hover interactions that should be attached to reference or trigger
 * elements.
 */
export function useHoverReferenceInteraction(
  store: FloatingRootContext,
  props: UseHoverReferenceInteractionProps = {},
): React.HTMLProps<Element> | undefined {
  const open = store.useState('open');
  const domReferenceElement = store.useState('domReferenceElement');
  const dataRef = store.context.dataRef;

  const {
    enabled = true,
    delay = 0,
    handleClose = null,
    mouseOnly = false,
    restMs = 0,
    move = true,
    triggerElement = null,
    externalTree,
    isActiveTrigger = true,
  } = props;

  const tree = useFloatingTree(externalTree);

  const {
    pointerTypeRef,
    interactedInsideRef,
    handlerRef: closeHandlerRef,
    blockMouseMoveRef,
    performedPointerEventsMutationRef,
    unbindMouseMoveRef,
    restTimeoutPendingRef,
    openChangeTimeout,
    restTimeout,
    handleCloseOptionsRef,
  } = useHoverInteractionSharedState(store);

  const handleCloseRef = useValueAsRef(handleClose);
  const delayRef = useValueAsRef(delay);
  const openRef = useValueAsRef(open);
  const restMsRef = useValueAsRef(restMs);

  if (isActiveTrigger) {
    // eslint-disable-next-line no-underscore-dangle
    handleCloseOptionsRef.current = handleCloseRef.current?.__options;
  }

  const isClickLikeOpenEvent = useStableCallback(() => {
    if (interactedInsideRef.current) {
      return true;
    }

    return dataRef.current.openEvent
      ? ['click', 'mousedown'].includes(dataRef.current.openEvent.type)
      : false;
  });

  const closeWithDelay = React.useCallback(
    (event: MouseEvent, runElseBranch = true) => {
      const closeDelay = getDelay(delayRef.current, 'close', pointerTypeRef.current);
      if (closeDelay && !closeHandlerRef.current) {
        openChangeTimeout.start(closeDelay, () =>
          store.setOpen(false, createChangeEventDetails(REASONS.triggerHover, event)),
        );
      } else if (runElseBranch) {
        openChangeTimeout.clear();
        store.setOpen(false, createChangeEventDetails(REASONS.triggerHover, event));
      }
    },
    [delayRef, closeHandlerRef, store, pointerTypeRef, openChangeTimeout],
  );

  const cleanupMouseMoveHandler = useStableCallback(() => {
    unbindMouseMoveRef.current();
    closeHandlerRef.current = undefined;
  });

  const clearPointerEvents = useStableCallback(() => {
    if (performedPointerEventsMutationRef.current) {
      const body = getDocument(domReferenceElement).body;
      body.style.pointerEvents = '';
      body.removeAttribute(safePolygonIdentifier);
      performedPointerEventsMutationRef.current = false;
    }
  });

  const handleScrollMouseLeave = useStableCallback((event: MouseEvent) => {
    if (isClickLikeOpenEvent()) {
      return;
    }
    if (!dataRef.current.floatingContext) {
      return;
    }

    const triggerElements = store.select('triggerElements');
    if (
      event.relatedTarget &&
      triggerElements &&
      triggerElements.includes(event.relatedTarget as Element)
    ) {
      return;
    }

    handleCloseRef.current?.({
      ...dataRef.current.floatingContext,
      tree,
      x: event.clientX,
      y: event.clientY,
      onClose() {
        clearPointerEvents();
        cleanupMouseMoveHandler();
        if (!isClickLikeOpenEvent()) {
          closeWithDelay(event);
        }
      },
    })(event);
  });

  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const trigger =
      (triggerElement as HTMLElement | null) ??
      (isActiveTrigger ? (domReferenceElement as HTMLElement | null) : null);

    if (!isElement(trigger)) {
      return undefined;
    }

    function onMouseEnter(event: MouseEvent) {
      openChangeTimeout.clear();
      blockMouseMoveRef.current = false;

      if (
        (mouseOnly && !isMouseLikePointerType(pointerTypeRef.current)) ||
        (getRestMs(restMsRef.current) > 0 && !getDelay(delayRef.current, 'open'))
      ) {
        return;
      }

      const openDelay = getDelay(delayRef.current, 'open', pointerTypeRef.current);
      const triggerNode = (event.currentTarget as HTMLElement) ?? undefined;

      const isOverInactiveTrigger =
        domReferenceElement && triggerNode && !contains(domReferenceElement, triggerNode);

      if (openDelay) {
        openChangeTimeout.start(openDelay, () => {
          if (!openRef.current) {
            store.setOpen(true, createChangeEventDetails(REASONS.triggerHover, event, triggerNode));
          }
        });
      } else if (!open || isOverInactiveTrigger) {
        store.setOpen(true, createChangeEventDetails(REASONS.triggerHover, event, triggerNode));
      }
    }

    function onMouseLeave(event: MouseEvent) {
      if (isClickLikeOpenEvent()) {
        clearPointerEvents();
        return;
      }

      unbindMouseMoveRef.current();

      const doc = getDocument(domReferenceElement);
      restTimeout.clear();
      restTimeoutPendingRef.current = false;

      const triggerElements = store.select('triggerElements');

      if (
        event.relatedTarget &&
        triggerElements &&
        triggerElements.includes(event.relatedTarget as Element)
      ) {
        return;
      }

      if (handleCloseRef.current && dataRef.current.floatingContext) {
        if (!open) {
          openChangeTimeout.clear();
        }

        closeHandlerRef.current = handleCloseRef.current({
          ...dataRef.current.floatingContext,
          tree,
          x: event.clientX,
          y: event.clientY,
          onClose() {
            clearPointerEvents();
            cleanupMouseMoveHandler();
            if (!isClickLikeOpenEvent()) {
              closeWithDelay(event, true);
            }
          },
        });

        const handler = closeHandlerRef.current;

        doc.addEventListener('mousemove', handler);
        unbindMouseMoveRef.current = () => {
          doc.removeEventListener('mousemove', handler);
        };

        return;
      }

      const shouldClose =
        pointerTypeRef.current === 'touch'
          ? !contains(store.select('floatingElement'), event.relatedTarget as Element | null)
          : true;
      if (shouldClose) {
        closeWithDelay(event);
      }
    }

    function onScrollMouseLeave(event: MouseEvent) {
      handleScrollMouseLeave(event);
    }

    if (open) {
      trigger.addEventListener('mouseleave', onScrollMouseLeave);
    }

    if (move) {
      trigger.addEventListener('mousemove', onMouseEnter, {
        once: true,
      });
    }

    trigger.addEventListener('mouseenter', onMouseEnter);
    trigger.addEventListener('mouseleave', onMouseLeave);

    return () => {
      if (open) {
        trigger.removeEventListener('mouseleave', onScrollMouseLeave);
      }

      if (move) {
        trigger.removeEventListener('mousemove', onMouseEnter);
      }

      trigger.removeEventListener('mouseenter', onMouseEnter);
      trigger.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [
    cleanupMouseMoveHandler,
    clearPointerEvents,
    blockMouseMoveRef,
    dataRef,
    delayRef,
    closeWithDelay,
    domReferenceElement,
    store,
    enabled,
    handleCloseRef,
    handleScrollMouseLeave,
    isActiveTrigger,
    isClickLikeOpenEvent,
    mouseOnly,
    move,
    open,
    openRef,
    pointerTypeRef,
    restMsRef,
    restTimeout,
    restTimeoutPendingRef,
    openChangeTimeout,
    triggerElement,
    tree,
    unbindMouseMoveRef,
    closeHandlerRef,
  ]);

  const referenceProps = React.useMemo<ElementProps['reference']>(() => {
    function setPointerRef(event: React.PointerEvent) {
      pointerTypeRef.current = event.pointerType;
    }

    return {
      onPointerDown: setPointerRef,
      onPointerEnter: setPointerRef,
      onMouseMove(event) {
        const { nativeEvent } = event;
        const trigger = event.currentTarget as HTMLElement;

        const currentDomReference = store.select('domReferenceElement');
        const currentOpen = store.select('open');

        const isOverInactiveTrigger =
          currentDomReference && !contains(currentDomReference, event.target as Element);

        function handleMouseMove() {
          if (!blockMouseMoveRef.current && (!store.select('open') || isOverInactiveTrigger)) {
            store.setOpen(
              true,
              createChangeEventDetails(REASONS.triggerHover, nativeEvent, trigger),
            );
          }
        }

        if (mouseOnly && !isMouseLikePointerType(pointerTypeRef.current)) {
          return;
        }

        if ((currentOpen && !isOverInactiveTrigger) || getRestMs(restMsRef.current) === 0) {
          return;
        }

        if (
          !isOverInactiveTrigger &&
          restTimeoutPendingRef.current &&
          event.movementX ** 2 + event.movementY ** 2 < 2
        ) {
          return;
        }

        restTimeout.clear();

        if (pointerTypeRef.current === 'touch') {
          handleMouseMove();
        } else if (isOverInactiveTrigger) {
          handleMouseMove();
        } else {
          restTimeoutPendingRef.current = true;
          restTimeout.start(getRestMs(restMsRef.current), handleMouseMove);
        }
      },
    };
  }, [
    blockMouseMoveRef,
    mouseOnly,
    store,
    pointerTypeRef,
    restMsRef,
    restTimeout,
    restTimeoutPendingRef,
  ]);

  return referenceProps;
}
