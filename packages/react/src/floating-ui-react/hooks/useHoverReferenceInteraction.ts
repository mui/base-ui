'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isElement } from '@floating-ui/utils/dom';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { ownerDocument } from '@base-ui/utils/owner';
import type {
  Delay,
  FloatingContext,
  FloatingRootContext,
  FloatingTreeType,
  SafePolygonOptions,
} from '../types';
import { contains, isMouseLikePointerType, isTargetInsideEnabledTrigger } from '../utils';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { useFloatingTree } from '../components/FloatingTree';
import type { FloatingTreeStore } from '../components/FloatingTreeStore';
import {
  safePolygonIdentifier,
  useHoverInteractionSharedState,
} from './useHoverInteractionSharedState';
import { FloatingUIOpenChangeDetails, HTMLProps } from '../../utils/types';

export interface HandleCloseContext extends FloatingContext {
  onClose: () => void;
  tree?: FloatingTreeType | null | undefined;
  leave?: boolean | undefined;
}

export interface HandleClose {
  (context: HandleCloseContext): (event: MouseEvent) => void;
  __options?: SafePolygonOptions | undefined;
}

export interface UseHoverProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event handlers.
   * @default true
   */
  enabled?: boolean | undefined;
  /**
   * Accepts an event handler that runs on `mousemove` to control when the
   * floating element closes once the cursor leaves the reference element.
   * @default null
   */
  handleClose?: HandleClose | null | undefined;
  /**
   * Waits until the user’s cursor is at “rest” over the reference element
   * before changing the `open` state.
   * @default 0
   */
  restMs?: number | (() => number) | undefined;
  /**
   * Waits for the specified time when the event listener runs before changing
   * the `open` state.
   * @default 0
   */
  delay?: Delay | (() => Delay) | undefined;
  /**
   * Whether moving the cursor over the floating element will open it, without a
   * regular hover event required.
   * @default true
   */
  move?: boolean | undefined;
}

export function getDelay(
  value: UseHoverProps['delay'],
  prop: 'open' | 'close',
  pointerType?: PointerEvent['pointerType'],
) {
  if (pointerType && !isMouseLikePointerType(pointerType)) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'function') {
    const result = value();
    if (typeof result === 'number') {
      return result;
    }
    return result?.[prop];
  }

  return value?.[prop];
}

export interface UseHoverReferenceInteractionProps extends UseHoverProps {
  enabled?: boolean | undefined;
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
}

function getRestMs(value: number | (() => number)) {
  if (typeof value === 'function') {
    return value();
  }
  return value;
}

const EMPTY_REF: Readonly<React.RefObject<Element | null>> = { current: null };

/**
 * Provides hover interactions that should be attached to reference or trigger
 * elements.
 */
export function useHoverReferenceInteraction(
  context: FloatingRootContext | FloatingContext,
  props: UseHoverReferenceInteractionProps = {},
): HTMLProps | undefined {
  const store = 'rootStore' in context ? context.rootStore : context;
  const domReferenceElement = store.useState('domReferenceElement');
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
    if (instance.interactedInside) {
      return true;
    }

    return dataRef.current.openEvent
      ? ['click', 'mousedown'].includes(dataRef.current.openEvent.type)
      : false;
  });

  const isRelatedTargetInsideEnabledTrigger = useStableCallback((target: EventTarget | null) => {
    return isTargetInsideEnabledTrigger(target, store.context.triggerElements);
  });

  const closeWithDelay = React.useCallback(
    (event: MouseEvent, runElseBranch = true) => {
      const closeDelay = getDelay(delayRef.current, 'close', instance.pointerType);
      if (closeDelay) {
        instance.openChangeTimeout.start(closeDelay, () => {
          store.setOpen(false, createChangeEventDetails(REASONS.triggerHover, event));
          tree?.events.emit('floating.closed', event);
        });
      } else if (runElseBranch) {
        instance.openChangeTimeout.clear();
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
    if (instance.performedPointerEventsMutation) {
      const body = ownerDocument(store.select('domReferenceElement')).body;
      body.style.pointerEvents = '';
      body.removeAttribute(safePolygonIdentifier);
      instance.performedPointerEventsMutation = false;
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
      (isActiveTrigger ? (domReferenceElement as HTMLElement | null) : null);

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
      if (getRestMs(restMsRef.current) > 0 && !getDelay(delayRef.current, 'open')) {
        return;
      }

      const openDelay = getDelay(delayRef.current, 'open', instance.pointerType);
      const currentDomReference = store.select('domReferenceElement');
      const allTriggers = store.context.triggerElements;

      const isOverInactiveTrigger =
        (allTriggers.hasElement(event.target as Element) ||
          allTriggers.hasMatchingElement((t) => contains(t, event.target as Element))) &&
        (!currentDomReference || !contains(currentDomReference, event.target as Element));

      const triggerNode = (event.currentTarget as HTMLElement | null) ?? undefined;

      const isOpen = store.select('open');
      const shouldOpen = !isOpen || isOverInactiveTrigger;

      // When moving between triggers while already open, open immediately without delay
      if (isOverInactiveTrigger && isOpen) {
        store.setOpen(true, createChangeEventDetails(REASONS.triggerHover, event, triggerNode));
      } else if (openDelay) {
        instance.openChangeTimeout.start(openDelay, () => {
          const latestDomReference = store.select('domReferenceElement');
          const shouldOpenForCurrentReference =
            triggerElementRef.current != null
              ? triggerElementRef.current === triggerNode
              : !isActiveTrigger ||
                !!(latestDomReference && contains(latestDomReference, triggerNode));

          if (shouldOpen && shouldOpenForCurrentReference) {
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

      const doc = ownerDocument(domReferenceElement);
      instance.restTimeout.clear();
      instance.restTimeoutPending = false;

      if (isRelatedTargetInsideEnabledTrigger(event.relatedTarget)) {
        return;
      }

      if (handleCloseRef.current && dataRef.current.floatingContext) {
        if (!store.select('open')) {
          instance.openChangeTimeout.clear();
        }

        const currentTrigger =
          (triggerElementRef.current as HTMLElement | null) ??
          (isActiveTrigger ? (store.select('domReferenceElement') as HTMLElement | null) : null);

        instance.handler = handleCloseRef.current({
          ...dataRef.current.floatingContext,
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
    isClickLikeOpenEvent,
    isRelatedTargetInsideEnabledTrigger,
    mouseOnly,
    move,
    restMsRef,
    triggerElementRef,
    tree,
    enabledRef,
    domReferenceElement,
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
        const allTriggers = store.context.triggerElements;
        const currentOpen = store.select('open');

        const isOverInactiveTrigger =
          (allTriggers.hasElement(event.target as Element) ||
            allTriggers.hasMatchingElement((t) => contains(t, event.target as Element))) &&
          (!currentDomReference || !contains(currentDomReference, event.target as Element));

        if (mouseOnly && !isMouseLikePointerType(instance.pointerType)) {
          return;
        }

        if ((currentOpen && !isOverInactiveTrigger) || getRestMs(restMsRef.current) === 0) {
          return;
        }

        if (
          !isOverInactiveTrigger &&
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

          if (!instance.blockMouseMove && (!latestOpen || isOverInactiveTrigger)) {
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
        } else if (isOverInactiveTrigger && currentOpen) {
          handleMouseMove();
        } else {
          instance.restTimeoutPending = true;
          instance.restTimeout.start(getRestMs(restMsRef.current), handleMouseMove);
        }
      },
    };
  }, [enabled, instance, isClickLikeOpenEvent, mouseOnly, store, restMsRef]);
}
