'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isElement } from '@floating-ui/utils/dom';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { ownerDocument } from '@base-ui/utils/owner';
import type { Delay, FloatingContext, FloatingRootContext } from '../types';
import { contains, isMouseLikePointerType, isTargetInsideEnabledTrigger } from '../utils';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { useFloatingTree } from '../components/FloatingTree';
import type { FloatingTreeStore } from '../components/FloatingTreeStore';
import {
  closeHoverPopup as closeHoverPopupShared,
  clearRecentHoverClose,
  clearSafePolygonPointerEventsMutation,
  useHoverInteractionSharedState,
  wasHoverClosedRecently,
} from './useHoverInteractionSharedState';
import type { HandleClose, HandleCloseContextBase } from './useHoverShared';
import {
  getDelay,
  getRestMs,
  isClickLikeOpenEvent as isClickLikeOpenEventShared,
} from './useHoverShared';
import { FloatingUIOpenChangeDetails, HTMLProps } from '../../utils/types';

export interface UseHoverReferenceInteractionProps {
  enabled?: boolean | undefined;
  handleClose?: HandleClose | null | undefined;
  restMs?: number | (() => number) | undefined;
  delay?: Delay | (() => Delay) | undefined;
  move?: boolean | undefined;
  mouseOnly?: boolean | undefined;
  externalTree?: FloatingTreeStore | undefined;
  /**
   * Whether the hook controls the active trigger. When false, the props are
   * returned under the `trigger` key so they can be applied to inactive
   * triggers via `getTriggerProps`.
   * @default true
   */
  isActiveTrigger?: boolean | undefined;
  triggerElementRef?: Readonly<React.RefObject<Element | null>> | undefined;
  getHandleCloseContext?: (() => HandleCloseContextBase | null) | undefined;
  /**
   * Reopens instantly for this many milliseconds after a committed hover close.
   * Useful for trigger-to-trigger and popup-to-trigger handoffs.
   * @default undefined
   */
  hoverCloseGracePeriod?: number | undefined;
}

const EMPTY_REF: Readonly<React.RefObject<Element | null>> = { current: null };
function shouldIgnoreOpenDelayAfterHoverClose(
  instance: ReturnType<typeof useHoverInteractionSharedState>,
  isOpen: boolean,
  hoverCloseGracePeriod: number | undefined,
) {
  // Applies to quick handoffs like trigger->trigger and popup->trigger.
  return !isOpen && wasHoverClosedRecently(instance, performance.now(), hoverCloseGracePeriod);
}

/**
 * Provides hover interactions that should be attached to reference or trigger
 * elements.
 */
export function useHoverReferenceInteraction(
  context: FloatingRootContext | FloatingContext,
  props: UseHoverReferenceInteractionProps = {},
): HTMLProps | undefined {
  const store = 'rootStore' in context ? context.rootStore : context;
  const open = store.useState('open');
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
    getHandleCloseContext,
    hoverCloseGracePeriod,
  } = props;

  const tree = useFloatingTree(externalTree);

  const instance = useHoverInteractionSharedState(store);

  const handleCloseRef = useValueAsRef(handleClose);
  const delayRef = useValueAsRef(delay);
  const restMsRef = useValueAsRef(restMs);
  const enabledRef = useValueAsRef(enabled);

  if (isActiveTrigger) {
    // eslint-disable-next-line no-underscore-dangle
    instance.handleCloseOptions = handleCloseRef.current?.__options;
  }

  const isClickLikeOpenEvent = useStableCallback(() => {
    return isClickLikeOpenEventShared(dataRef.current.openEvent?.type, instance.interactedInside);
  });

  const isHoverOpen = useStableCallback(() => {
    const openEventType = dataRef.current.openEvent?.type;
    return openEventType?.includes('mouse') === true && openEventType !== 'mousedown';
  });

  const isRelatedTargetInsideEnabledTrigger = useStableCallback((target: EventTarget | null) => {
    return isTargetInsideEnabledTrigger(target, store.context.triggerElements);
  });

  const closeHoverPopup = useStableCallback((event: MouseEvent) => {
    // Emit tree close only when a hover-close was actually committed.
    if (closeHoverPopupShared(store, instance, event, isHoverOpen(), hoverCloseGracePeriod)) {
      tree?.events.emit('floating.closed', event);
    }
  });

  const isOverInactiveTrigger = useStableCallback(
    (
      currentDomReference: Element | null,
      currentTarget: Element,
      target: EventTarget | null,
    ): boolean => {
      const allTriggers = store.context.triggerElements;

      // Fast path for normal usage where handlers are attached directly to triggers.
      if (allTriggers.hasElement(currentTarget)) {
        return !currentDomReference || !contains(currentDomReference, currentTarget);
      }

      // Fallback for delegated/wrapper usage where currentTarget may be outside the trigger map.
      if (!isElement(target)) {
        return false;
      }

      const targetElement = target as Element;
      return (
        allTriggers.hasMatchingElement((trigger) => contains(trigger, targetElement)) &&
        (!currentDomReference || !contains(currentDomReference, targetElement))
      );
    },
  );

  const closeWithDelay = useStableCallback((event: MouseEvent, runElseBranch = true) => {
    if (!store.select('open')) {
      instance.openChangeTimeout.clear();
      return;
    }

    const closeDelay = getDelay(delayRef.current, 'close', instance.pointerType);
    if (closeDelay) {
      instance.openChangeTimeout.start(closeDelay, () => closeHoverPopup(event));
    } else if (runElseBranch) {
      instance.openChangeTimeout.clear();
      closeHoverPopup(event);
    }
  });

  const cleanupMouseMoveHandler = useStableCallback(() => {
    if (!instance.handler) {
      return;
    }
    const doc = ownerDocument(store.select('domReferenceElement'));
    doc.removeEventListener('mousemove', instance.handler);
    instance.handler = undefined;
  });

  React.useEffect(() => cleanupMouseMoveHandler, [cleanupMouseMoveHandler]);

  const clearPointerEvents = useStableCallback(() => {
    clearSafePolygonPointerEventsMutation(instance);
  });

  React.useEffect(() => {
    if (open) {
      // Programmatic/controlled `open` updates may not emit `openchange`.
      // Clear stale grace once any new open cycle starts.
      clearRecentHoverClose(instance);
    }
  }, [instance, open]);

  // When closing before opening, clear the delay timeouts to cancel it
  // from showing.
  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    function onOpenChangeLocal(details: FloatingUIOpenChangeDetails) {
      if (details.reason !== REASONS.triggerHover) {
        clearRecentHoverClose(instance);
      }

      if (!details.open) {
        cleanupMouseMoveHandler();
        instance.openChangeTimeout.clear();
        instance.restTimeout.clear();
        instance.blockMouseMove = true;
        instance.restTimeoutPending = false;
      }
    }

    events.on('openchange', onOpenChangeLocal);
    return () => {
      events.off('openchange', onOpenChangeLocal);
    };
  }, [enabled, events, instance, cleanupMouseMoveHandler]);

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
      instance.openChangeTimeout.clear();
      instance.blockMouseMove = false;

      if (mouseOnly && !isMouseLikePointerType(instance.pointerType)) {
        return;
      }

      // Only rest delay is set; there's no fallback delay.
      // This will be handled by `onMouseMove`.
      const restMsValue = getRestMs(restMsRef.current);
      if (restMsValue > 0 && !getDelay(delayRef.current, 'open')) {
        return;
      }

      const openDelay = getDelay(delayRef.current, 'open', instance.pointerType);
      const triggerNode = (event.currentTarget as HTMLElement) ?? null;
      const currentDomReference = store.select('domReferenceElement');
      const isOverInactive =
        triggerNode == null
          ? false
          : isOverInactiveTrigger(currentDomReference, triggerNode, event.target);

      const isOpen = store.select('open');
      const shouldOpen = !isOpen || isOverInactive;
      // If a hover-popup was closed recently, skip open delay.
      const shouldIgnoreDelay = shouldIgnoreOpenDelayAfterHoverClose(
        instance,
        isOpen,
        hoverCloseGracePeriod,
      );

      // When moving between triggers while already open, open immediately without delay
      if (isOverInactive && isOpen) {
        store.setOpen(true, createChangeEventDetails(REASONS.triggerHover, event, triggerNode));
      } else if (openDelay && !shouldIgnoreDelay) {
        instance.openChangeTimeout.start(openDelay, () => {
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

      cleanupMouseMoveHandler();

      const domReferenceElement = store.select('domReferenceElement');
      const doc = ownerDocument(domReferenceElement);
      instance.restTimeout.clear();
      instance.restTimeoutPending = false;

      const handleCloseContextBase = dataRef.current.floatingContext ?? getHandleCloseContext?.();

      const ignoreRelatedTargetTrigger = isRelatedTargetInsideEnabledTrigger(event.relatedTarget);

      if (ignoreRelatedTargetTrigger) {
        return;
      }

      if (handleCloseRef.current && handleCloseContextBase) {
        if (!store.select('open')) {
          instance.openChangeTimeout.clear();
        }

        const currentTrigger = triggerElementRef.current;

        instance.handler = handleCloseRef.current({
          ...handleCloseContextBase,
          tree,
          x: event.clientX,
          y: event.clientY,
          onClose() {
            clearPointerEvents();
            cleanupMouseMoveHandler();
            if (
              enabledRef.current &&
              !isClickLikeOpenEvent() &&
              currentTrigger === store.select('domReferenceElement')
            ) {
              closeWithDelay(event, true);
            }
          },
        });

        doc.addEventListener('mousemove', instance.handler);
        instance.handler(event);

        return;
      }

      const shouldClose =
        instance.pointerType === 'touch'
          ? !contains(store.select('floatingElement'), event.relatedTarget as Element | null)
          : true;

      if (shouldClose) {
        closeWithDelay(event);
      }
    }

    if (move) {
      trigger.addEventListener('mousemove', onMouseEnter, {
        once: true,
      });
    }

    trigger.addEventListener('mouseenter', onMouseEnter);
    trigger.addEventListener('mouseleave', onMouseLeave);

    return () => {
      if (move) {
        trigger.removeEventListener('mousemove', onMouseEnter);
      }

      trigger.removeEventListener('mouseenter', onMouseEnter);
      trigger.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [
    cleanupMouseMoveHandler,
    clearPointerEvents,
    dataRef,
    delayRef,
    closeWithDelay,
    store,
    enabled,
    handleCloseRef,
    instance,
    isActiveTrigger,
    isOverInactiveTrigger,
    isClickLikeOpenEvent,
    isRelatedTargetInsideEnabledTrigger,
    mouseOnly,
    move,
    restMsRef,
    triggerElementRef,
    tree,
    enabledRef,
    getHandleCloseContext,
    hoverCloseGracePeriod,
  ]);

  return React.useMemo<HTMLProps | undefined>(() => {
    if (!enabled) {
      return undefined;
    }

    function setPointerRef(event: React.PointerEvent) {
      instance.pointerType = event.pointerType;
    }

    return {
      onPointerDown: setPointerRef,
      onPointerEnter: setPointerRef,
      onMouseMove(event) {
        const { nativeEvent } = event;
        const trigger = event.currentTarget as HTMLElement;

        const currentDomReference = store.select('domReferenceElement');
        const currentOpen = store.select('open');
        const shouldIgnoreDelay = shouldIgnoreOpenDelayAfterHoverClose(
          instance,
          currentOpen,
          hoverCloseGracePeriod,
        );
        const isOverInactive = isOverInactiveTrigger(currentDomReference, trigger, event.target);

        if (mouseOnly && !isMouseLikePointerType(instance.pointerType)) {
          return;
        }

        const restMsValue = getRestMs(restMsRef.current);
        if ((currentOpen && !isOverInactive) || restMsValue === 0) {
          return;
        }

        if (
          !isOverInactive &&
          instance.restTimeoutPending &&
          event.movementX ** 2 + event.movementY ** 2 < 2
        ) {
          return;
        }

        instance.restTimeout.clear();

        function handleMouseMove() {
          instance.restTimeoutPending = false;

          // A delayed hover open should not override a click-like open that happened
          // while the hover delay was pending.
          if (isClickLikeOpenEvent()) {
            return;
          }

          const latestOpen = store.select('open');

          if (!instance.blockMouseMove && (!latestOpen || isOverInactive)) {
            store.setOpen(
              true,
              createChangeEventDetails(REASONS.triggerHover, nativeEvent, trigger),
            );
          }
        }

        if (instance.pointerType === 'touch') {
          ReactDOM.flushSync(() => {
            handleMouseMove();
          });
        } else if (isOverInactive && currentOpen) {
          handleMouseMove();
        } else if (shouldIgnoreDelay) {
          handleMouseMove();
        } else {
          instance.restTimeoutPending = true;
          instance.restTimeout.start(restMsValue, handleMouseMove);
        }
      },
    };
  }, [
    enabled,
    hoverCloseGracePeriod,
    instance,
    isClickLikeOpenEvent,
    isOverInactiveTrigger,
    mouseOnly,
    store,
    restMsRef,
  ]);
}
