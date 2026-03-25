'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isElement } from '@floating-ui/utils/dom';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { ownerDocument } from '@base-ui/utils/owner';
import type { Delay, FloatingContext, FloatingRootContext } from '../types';
import {
  contains,
  getTarget,
  isMouseLikePointerType,
  isTargetInsideEnabledTrigger,
} from '../utils';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { useFloatingTree } from '../components/FloatingTree';
import type { FloatingTreeStore } from '../components/FloatingTreeStore';
import {
  applySafePolygonPointerEventsMutation,
  clearSafePolygonPointerEventsMutation,
  useHoverInteractionSharedState,
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
}

const EMPTY_REF: Readonly<React.RefObject<Element | null>> = { current: null };

function getElementDebugName(element: EventTarget | Element | null | undefined): string {
  if (!isElement(element)) {
    return 'null';
  }

  const id = element.id ? `#${element.id}` : '';
  const testId = element.getAttribute('data-testid');
  const role = element.getAttribute('role');
  const text = element.textContent?.trim().slice(0, 40) ?? '';
  const testIdPart = testId ? `[data-testid="${testId}"]` : '';
  const rolePart = role ? `[role="${role}"]` : '';
  const textPart = text ? `("${text}")` : '';
  return `${element.tagName.toLowerCase()}${id}${testIdPart}${rolePart}${textPart}`;
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
  } = props;

  const tree = useFloatingTree(externalTree);

  const instance = useHoverInteractionSharedState(store);
  const lastHoverCloseAtRef = React.useRef<number>(Number.NEGATIVE_INFINITY);

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

  const isRelatedTargetInsideEnabledTrigger = useStableCallback((target: EventTarget | null) => {
    return isTargetInsideEnabledTrigger(target, store.context.triggerElements);
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

  const closeWithDelay = React.useCallback(
    (event: MouseEvent, runElseBranch = true) => {
      const closeDelay = getDelay(delayRef.current, 'close', instance.pointerType);
      // eslint-disable-next-line no-console
      console.log('[PreviewCardDebug][Reference] closeWithDelay requested', {
        closeDelay,
        runElseBranch,
        pointerType: instance.pointerType,
        activeReference: getElementDebugName(store.select('domReferenceElement')),
        eventType: event.type,
        eventTarget: getElementDebugName(getTarget(event)),
      });
      if (closeDelay) {
        instance.openChangeTimeout.start(closeDelay, () => {
          // eslint-disable-next-line no-console
          console.log('[PreviewCardDebug][Reference] closeWithDelay fired', {
            closeDelay,
            activeReference: getElementDebugName(store.select('domReferenceElement')),
            eventType: event.type,
          });
          store.setOpen(false, createChangeEventDetails(REASONS.triggerHover, event));
          tree?.events.emit('floating.closed', event);
        });
      } else if (runElseBranch) {
        instance.openChangeTimeout.clear();
        // eslint-disable-next-line no-console
        console.log('[PreviewCardDebug][Reference] closeWithDelay immediate close', {
          activeReference: getElementDebugName(store.select('domReferenceElement')),
          eventType: event.type,
        });
        store.setOpen(false, createChangeEventDetails(REASONS.triggerHover, event));
        tree?.events.emit('floating.closed', event);
      }
    },
    [delayRef, store, instance, tree],
  );

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

  // When closing before opening, clear the delay timeouts to cancel it
  // from showing.
  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    function onOpenChangeLocal(details: FloatingUIOpenChangeDetails) {
      // eslint-disable-next-line no-console
      console.log('[PreviewCardDebug][Reference] openchange event', {
        open: details.open,
        reason: details.reason,
        activeReference: getElementDebugName(store.select('domReferenceElement')),
        triggerElement: getElementDebugName(details.triggerElement ?? null),
      });
      if (!details.open) {
        if (details.reason === REASONS.triggerHover) {
          lastHoverCloseAtRef.current = performance.now();
        }
        // eslint-disable-next-line no-console
        console.log('[PreviewCardDebug][Reference] openchange(false) clears timers', {
          reason: details.reason,
          activeReference: getElementDebugName(store.select('domReferenceElement')),
          triggerRef: getElementDebugName(triggerElementRef.current),
        });
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
  }, [enabled, events, instance, cleanupMouseMoveHandler, store, triggerElementRef]);

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
      const floatingElement = store.select('floatingElement');
      const hasPreviousReference = isElement(currentDomReference);
      const isOverInactive =
        triggerNode == null
          ? false
          : isOverInactiveTrigger(currentDomReference, triggerNode, getTarget(event));
      const isOpen = store.select('open');
      const isInClosingTransition =
        isElement(floatingElement) && floatingElement.hasAttribute('data-ending-style');
      const isInCloseLifecycle = !isOpen && isElement(floatingElement);
      const closeDelay = getDelay(delayRef.current, 'close', instance.pointerType) ?? 0;
      const handoffWindowMs = Math.max(100, closeDelay + 50);
      const justClosedFromHover =
        performance.now() - lastHoverCloseAtRef.current <= handoffWindowMs;
      const isReenteringSameTriggerInHandoffWindow =
        !isOverInactive &&
        isElement(triggerNode) &&
        isElement(currentDomReference) &&
        contains(currentDomReference, triggerNode) &&
        isInCloseLifecycle &&
        justClosedFromHover;

      const shouldOpen = !isOpen || isOverInactive;

      // eslint-disable-next-line no-console
      console.log('[PreviewCardDebug][Reference] mouseenter', {
        trigger: getElementDebugName(triggerNode),
        activeReference: getElementDebugName(currentDomReference),
        hasPreviousReference,
        isOpen,
        isOverInactive,
        isInClosingTransition,
        isInCloseLifecycle,
        isReenteringSameTriggerInHandoffWindow,
        justClosedFromHover,
        handoffWindowMs,
        shouldOpen,
        openDelay,
        pointerType: instance.pointerType,
      });

      // Open immediately when moving between triggers while open, during close transition,
      // or within a short post-close handoff window.
      if (
        (isOverInactive &&
          (isOpen || isInClosingTransition || (hasPreviousReference && justClosedFromHover))) ||
        isReenteringSameTriggerInHandoffWindow
      ) {
        store.setOpen(true, createChangeEventDetails(REASONS.triggerHover, event, triggerNode));
      } else if (openDelay) {
        // eslint-disable-next-line no-console
        console.log('[PreviewCardDebug][Reference] openWithDelay scheduled', {
          trigger: getElementDebugName(triggerNode),
          openDelay,
          activeReference: getElementDebugName(currentDomReference),
          isOpen,
          isOverInactive,
        });
        instance.openChangeTimeout.start(openDelay, () => {
          // eslint-disable-next-line no-console
          console.log('[PreviewCardDebug][Reference] openWithDelay fired', {
            trigger: getElementDebugName(triggerNode),
            openDelay,
            shouldOpen,
            currentOpen: store.select('open'),
            activeReference: getElementDebugName(store.select('domReferenceElement')),
          });
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

      // eslint-disable-next-line no-console
      console.log('[PreviewCardDebug][Reference] mouseleave', {
        trigger: getElementDebugName(event.currentTarget as Element | null),
        relatedTarget: getElementDebugName(event.relatedTarget as Element | null),
        activeReference: getElementDebugName(store.select('domReferenceElement')),
        ignoreRelatedTargetTrigger,
        hasSafePolygonHandler: Boolean(handleCloseRef.current),
      });

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

      // eslint-disable-next-line no-console
      console.log('[PreviewCardDebug][Reference] mouseleave shouldClose', {
        shouldClose,
        pointerType: instance.pointerType,
        floatingElement: getElementDebugName(store.select('floatingElement')),
      });

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
        const isOverInactive = isOverInactiveTrigger(
          currentDomReference,
          trigger,
          getTarget(nativeEvent),
        );

        if (mouseOnly && !isMouseLikePointerType(instance.pointerType)) {
          return;
        }

        if (currentOpen && isOverInactive && instance.handleCloseOptions?.blockPointerEvents) {
          const floatingElement = store.select('floatingElement');

          if (floatingElement) {
            const scopeElement =
              instance.handleCloseOptions?.getScope?.() ?? trigger.ownerDocument.body;

            applySafePolygonPointerEventsMutation(instance, {
              scopeElement,
              referenceElement: trigger,
              floatingElement,
            });
          }
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
        } else {
          instance.restTimeoutPending = true;
          instance.restTimeout.start(restMsValue, handleMouseMove);
        }
      },
    };
  }, [enabled, instance, isClickLikeOpenEvent, isOverInactiveTrigger, mouseOnly, store, restMsRef]);
}
