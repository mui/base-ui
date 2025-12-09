import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { ContextData, FloatingRootContext, SafePolygonOptions } from '../types';
import { getDocument, getTarget, isMouseLikePointerType } from '../utils';
import { createAttribute } from '../utils/createAttribute';
import { TYPEABLE_SELECTOR } from '../utils/constants';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';

export function getRestMs(value: number | (() => number)) {
  if (typeof value === 'function') {
    return value();
  }
  return value;
}

export const safePolygonIdentifier = createAttribute('safe-polygon');
const interactiveSelector = `button,a,[role="button"],select,[tabindex]:not([tabindex="-1"]),${TYPEABLE_SELECTOR}`;
const clickLikeEvents = new Set(['click', 'mousedown']);

export function isInteractiveElement(element: Element | null) {
  return element ? Boolean(element.closest(interactiveSelector)) : false;
}

export function getCloseDelay(
  value: number | (() => number),
  pointerType?: PointerEvent['pointerType'],
) {
  if (pointerType && !isMouseLikePointerType(pointerType)) {
    return 0;
  }

  if (typeof value === 'function') {
    return value();
  }

  return value;
}

export interface HoverInteractionSharedState {
  pointerTypeRef: React.RefObject<string | undefined>;
  interactedInsideRef: React.RefObject<boolean>;
  handlerRef: React.RefObject<((event: MouseEvent) => void) | undefined>;
  blockMouseMoveRef: React.RefObject<boolean>;
  performedPointerEventsMutationRef: React.RefObject<boolean>;
  unbindMouseMoveRef: React.RefObject<() => void>;
  restTimeoutPendingRef: React.RefObject<boolean>;
  openChangeTimeout: ReturnType<typeof useTimeout>;
  restTimeout: ReturnType<typeof useTimeout>;
  handleCloseOptionsRef: React.RefObject<SafePolygonOptions | undefined>;
}

type HoverContextData = ContextData & {
  hoverInteractionState?: HoverInteractionSharedState;
};

export function useHoverInteractionSharedState(
  store: FloatingRootContext,
): HoverInteractionSharedState {
  const pointerTypeRef = React.useRef<string | undefined>(undefined);
  const interactedInsideRef = React.useRef(false);
  const handlerRef = React.useRef<((event: MouseEvent) => void) | undefined>(undefined);
  const blockMouseMoveRef = React.useRef(true);
  const performedPointerEventsMutationRef = React.useRef(false);
  const unbindMouseMoveRef = React.useRef<() => void>(() => {});
  const restTimeoutPendingRef = React.useRef(false);
  const openChangeTimeout = useTimeout();
  const restTimeout = useTimeout();
  const handleCloseOptionsRef = React.useRef<SafePolygonOptions | undefined>(undefined);

  return React.useMemo(() => {
    const data = store.context.dataRef.current as HoverContextData;

    if (!data.hoverInteractionState) {
      data.hoverInteractionState = {
        pointerTypeRef,
        interactedInsideRef,
        handlerRef,
        blockMouseMoveRef,
        performedPointerEventsMutationRef,
        unbindMouseMoveRef,
        restTimeoutPendingRef,
        openChangeTimeout,
        restTimeout,
        handleCloseOptionsRef,
      };
    }

    return data.hoverInteractionState;
  }, [
    store,
    pointerTypeRef,
    interactedInsideRef,
    handlerRef,
    blockMouseMoveRef,
    performedPointerEventsMutationRef,
    unbindMouseMoveRef,
    restTimeoutPendingRef,
    openChangeTimeout,
    restTimeout,
    handleCloseOptionsRef,
  ]);
}

export interface HoverInteractionSharedMethods {
  isClickLikeOpenEvent: () => boolean;
  isHoverOpen: () => boolean;
  handleInteractInside: (event: PointerEvent) => void;
  closeWithDelay: (event: MouseEvent, runElseBranch?: boolean) => void;
  cleanupMouseMoveHandler: () => void;
  clearPointerEvents: () => void;
}

export function useHoverInteractionSharedMethods(
  store: FloatingRootContext,
  sharedState: HoverInteractionSharedState,
  getCloseDelayValue: () => number | undefined,
): HoverInteractionSharedMethods {
  const {
    interactedInsideRef,
    handlerRef,
    performedPointerEventsMutationRef,
    unbindMouseMoveRef,
    openChangeTimeout,
  } = sharedState;
  const { dataRef } = store.context;

  const isClickLikeOpenEvent = useStableCallback(() => {
    if (interactedInsideRef.current) {
      return true;
    }

    return dataRef.current.openEvent ? clickLikeEvents.has(dataRef.current.openEvent.type) : false;
  });

  const closeWithDelay = useStableCallback((event: MouseEvent, runElseBranch = true) => {
    const closeDelay = getCloseDelayValue();
    if (closeDelay && !handlerRef.current) {
      openChangeTimeout.start(closeDelay, () => {
        store.setOpen(false, createChangeEventDetails(REASONS.triggerHover, event));
      });
    } else if (runElseBranch) {
      openChangeTimeout.clear();
      store.setOpen(false, createChangeEventDetails(REASONS.triggerHover, event));
    }
  });

  const cleanupMouseMoveHandler = useStableCallback(() => {
    unbindMouseMoveRef.current();
    handlerRef.current = undefined;
  });

  const clearPointerEvents = useStableCallback(() => {
    if (performedPointerEventsMutationRef.current) {
      const body = getDocument(store.select('domReferenceElement')).body;
      body.style.pointerEvents = '';
      body.removeAttribute(safePolygonIdentifier);
      performedPointerEventsMutationRef.current = false;
    }
  });

  const isHoverOpen = useStableCallback(() => {
    const type = dataRef.current.openEvent?.type;
    return !!type?.includes('mouse') && type !== 'mousedown';
  });

  const handleInteractInside = useStableCallback((event: PointerEvent) => {
    const target = getTarget(event) as Element | null;
    if (!isInteractiveElement(target)) {
      interactedInsideRef.current = false;
      return;
    }

    interactedInsideRef.current = true;
  });

  return {
    isClickLikeOpenEvent,
    isHoverOpen,
    handleInteractInside,
    closeWithDelay,
    cleanupMouseMoveHandler,
    clearPointerEvents,
  };
}
