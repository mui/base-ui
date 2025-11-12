import * as React from 'react';
import { useTimeout } from '@base-ui-components/utils/useTimeout';

import type { ContextData, FloatingRootContext } from '../types';
import { createAttribute } from '../utils/createAttribute';
import { TYPEABLE_SELECTOR } from '../utils/constants';
import { getEmptyContext } from './useFloatingRootContext';

export const safePolygonIdentifier = createAttribute('safe-polygon');
const interactiveSelector = `button,a,[role="button"],select,[tabindex]:not([tabindex="-1"]),${TYPEABLE_SELECTOR}`;

export function isInteractiveElement(element: Element | null) {
  return element ? Boolean(element.closest(interactiveSelector)) : false;
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
}

type HoverContextData = ContextData & {
  hoverInteractionState?: HoverInteractionSharedState;
};

export function useHoverInteractionSharedState(
  context: FloatingRootContext | null,
): HoverInteractionSharedState {
  const ctx = context ?? getEmptyContext();

  const pointerTypeRef = React.useRef<string | undefined>(undefined);
  const interactedInsideRef = React.useRef(false);
  const handlerRef = React.useRef<((event: MouseEvent) => void) | undefined>(undefined);
  const blockMouseMoveRef = React.useRef(true);
  const performedPointerEventsMutationRef = React.useRef(false);
  const unbindMouseMoveRef = React.useRef<() => void>(() => {});
  const restTimeoutPendingRef = React.useRef(false);
  const timeout = useTimeout();
  const restTimeout = useTimeout();

  return React.useMemo(() => {
    const data = ctx.dataRef.current as HoverContextData;

    if (!data.hoverInteractionState) {
      data.hoverInteractionState = {
        pointerTypeRef,
        interactedInsideRef,
        handlerRef,
        blockMouseMoveRef,
        performedPointerEventsMutationRef,
        unbindMouseMoveRef,
        restTimeoutPendingRef,
        openChangeTimeout: timeout,
        restTimeout,
      };
    }

    return data.hoverInteractionState;
  }, [
    ctx.dataRef,
    pointerTypeRef,
    interactedInsideRef,
    handlerRef,
    blockMouseMoveRef,
    performedPointerEventsMutationRef,
    unbindMouseMoveRef,
    restTimeoutPendingRef,
    timeout,
    restTimeout,
  ]);
}
