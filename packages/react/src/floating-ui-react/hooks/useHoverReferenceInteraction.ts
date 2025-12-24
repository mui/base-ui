import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isElement } from '@floating-ui/utils/dom';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { FloatingContext, FloatingRootContext } from '../types';
import { contains, getDocument, isMouseLikePointerType } from '../utils';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import type { UseHoverProps } from './useHover';
import { getDelay } from './useHover';
import { useFloatingTree } from '../components/FloatingTree';
import {
  getRestMs,
  useHoverInteractionSharedState,
  useHoverInteractionSharedMethods,
} from './useHoverInteractionSharedState';
import { FloatingUIOpenChangeDetails, HTMLProps } from '../../utils/types';

export interface UseHoverReferenceInteractionProps extends Omit<UseHoverProps, 'triggerElement'> {
  /**
   * Whether the hook controls the active trigger. When false, the props are
   * returned under the `trigger` key so they can be applied to inactive
   * triggers via `getTriggerProps`.
   * @default true
   */
  isActiveTrigger?: boolean;
  triggerElementRef?: Readonly<React.RefObject<Element | null>>;
}

const EMPTY_REF: Readonly<React.RefObject<Element | null>> = { current: null };

/**
 * Provides hover interactions that should be attached to reference or trigger
 * elements.
 */
export function useHoverReferenceInteraction(
  context: FloatingRootContext | FloatingContext,
  props: UseHoverReferenceInteractionProps = {},
) {
  const store = 'rootStore' in context ? context.rootStore : context;
  const { dataRef, events } = store.context;

  const {
    enabled = true,
    delay = 0,
    handleClose = null,
    mouseOnly = false,
    restMs = 0,
    move = true,
    triggerElementRef = EMPTY_REF,
    externalTree,
    isActiveTrigger = true,
  } = props;

  const tree = useFloatingTree(externalTree);

  const handleCloseRef = useValueAsRef(handleClose);
  const delayRef = useValueAsRef(delay);
  const restMsRef = useValueAsRef(restMs);

  const sharedState = useHoverInteractionSharedState(store);
  const {
    pointerTypeRef,
    blockMouseMoveRef,
    unbindMouseMoveRef,
    restTimeoutPendingRef,
    openChangeTimeout,
    restTimeout,
    handleCloseOptionsRef,
  } = sharedState;

  const closeHandlerRef = sharedState.handlerRef;

  const { isClickLikeOpenEvent, closeWithDelay, cleanupMouseMoveHandler, clearPointerEvents } =
    useHoverInteractionSharedMethods(store, sharedState, () =>
      getDelay(delayRef.current, 'close', pointerTypeRef.current),
    );

  useIsoLayoutEffect(() => {
    if (isActiveTrigger) {
      // eslint-disable-next-line no-underscore-dangle
      handleCloseOptionsRef.current = handleCloseRef.current?.__options;
    }
  });

  // When closing before opening, clear the delay timeouts to cancel it
  // from showing.
  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    function onOpenChangeLocal(details: FloatingUIOpenChangeDetails) {
      if (!details.open) {
        openChangeTimeout.clear();
        restTimeout.clear();
        blockMouseMoveRef.current = true;
        restTimeoutPendingRef.current = false;
      }
    }

    events.on('openchange', onOpenChangeLocal);
    return () => {
      events.off('openchange', onOpenChangeLocal);
    };
  }, [enabled, events, openChangeTimeout, restTimeout, blockMouseMoveRef, restTimeoutPendingRef]);

  const handleScrollMouseLeave = useStableCallback((event: MouseEvent) => {
    if (isClickLikeOpenEvent()) {
      return;
    }
    if (!dataRef.current.floatingContext) {
      return;
    }

    const triggerElements = store.context.triggerElements;
    if (event.relatedTarget && triggerElements.hasElement(event.relatedTarget as Element)) {
      return;
    }

    const currentTrigger = triggerElementRef.current;

    handleCloseRef.current?.({
      ...dataRef.current.floatingContext,
      tree,
      x: event.clientX,
      y: event.clientY,
      onClose() {
        clearPointerEvents();
        cleanupMouseMoveHandler();
        if (!isClickLikeOpenEvent() && currentTrigger === store.select('domReferenceElement')) {
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
      (triggerElementRef.current as HTMLElement | null) ??
      (isActiveTrigger ? (store.select('domReferenceElement') as HTMLElement | null) : null);

    if (!isElement(trigger)) {
      return undefined;
    }

    function onMouseEnter(event: MouseEvent) {
      openChangeTimeout.clear();
      blockMouseMoveRef.current = false;

      if (mouseOnly && !isMouseLikePointerType(pointerTypeRef.current)) {
        return;
      }

      // Only rest delay is set; there's no fallback delay.
      // This will be handled by `onMouseMove`.
      if (getRestMs(restMsRef.current) > 0 && !getDelay(delayRef.current, 'open')) {
        return;
      }

      const openDelay = getDelay(delayRef.current, 'open', pointerTypeRef.current);
      const currentDomReference = store.select('domReferenceElement');
      const allTriggers = store.context.triggerElements;

      const isOverInactiveTrigger =
        (allTriggers.hasElement(event.target as Element) ||
          allTriggers.hasMatchingElement((t) => contains(t, event.target as Element))) &&
        (!currentDomReference || !contains(currentDomReference, event.target as Element));

      const triggerNode = (event.currentTarget as HTMLElement) ?? null;

      const shouldOpen = !store.select('open') || isOverInactiveTrigger;

      if (openDelay) {
        openChangeTimeout.start(openDelay, () => {
          if (shouldOpen) {
            store.setOpen(true, createChangeEventDetails(REASONS.triggerHover, event, triggerNode));
          }
        });
      } else if (shouldOpen) {
        store.setOpen(true, createChangeEventDetails(REASONS.triggerHover, event, triggerNode));
      }
    }

    function onMouseLeave(event: MouseEvent) {
      if (isClickLikeOpenEvent()) {
        clearPointerEvents();
        return;
      }

      unbindMouseMoveRef.current();

      const domReferenceElement = store.select('domReferenceElement');
      const doc = getDocument(domReferenceElement);
      restTimeout.clear();
      restTimeoutPendingRef.current = false;

      const triggerElements = store.context.triggerElements;

      if (event.relatedTarget && triggerElements.hasElement(event.relatedTarget as Element)) {
        return;
      }

      if (handleCloseRef.current && dataRef.current.floatingContext) {
        if (!store.select('open')) {
          openChangeTimeout.clear();
        }

        const currentTrigger = triggerElementRef.current;

        closeHandlerRef.current = handleCloseRef.current({
          ...dataRef.current.floatingContext,
          tree,
          x: event.clientX,
          y: event.clientY,
          onClose() {
            clearPointerEvents();
            cleanupMouseMoveHandler();
            if (!isClickLikeOpenEvent() && currentTrigger === store.select('domReferenceElement')) {
              closeWithDelay(event, true);
            }
          },
        });

        const handler = closeHandlerRef.current;
        handler(event);

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

    if (store.select('open')) {
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
      cleanupMouseMoveHandler();
      openChangeTimeout.clear();
      restTimeout.clear();

      trigger.removeEventListener('mouseleave', onScrollMouseLeave);

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
    store,
    enabled,
    handleCloseRef,
    handleScrollMouseLeave,
    isActiveTrigger,
    isClickLikeOpenEvent,
    mouseOnly,
    move,
    pointerTypeRef,
    restMsRef,
    restTimeout,
    restTimeoutPendingRef,
    openChangeTimeout,
    triggerElementRef,
    tree,
    unbindMouseMoveRef,
    closeHandlerRef,
  ]);

  return React.useMemo<HTMLProps>(() => {
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
        const allTriggers = store.context.triggerElements;
        const currentOpen = store.select('open');

        const isOverInactiveTrigger =
          (allTriggers.hasElement(event.target as Element) ||
            allTriggers.hasMatchingElement((t) => contains(t, event.target as Element))) &&
          (!currentDomReference || !contains(currentDomReference, event.target as Element));

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

        function handleMouseMove() {
          if (!blockMouseMoveRef.current && (!currentOpen || isOverInactiveTrigger)) {
            store.setOpen(
              true,
              createChangeEventDetails(REASONS.triggerHover, nativeEvent, trigger),
            );
          }
        }

        if (pointerTypeRef.current === 'touch') {
          ReactDOM.flushSync(handleMouseMove);
        } else if (isOverInactiveTrigger && currentOpen) {
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
}
