import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';

import type { ContextData, FloatingRootContext, SafePolygonOptions } from '../types';
import { createAttribute } from '../utils/createAttribute';
import { TYPEABLE_SELECTOR } from '../utils/constants';

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
  handleCloseOptionsRef: React.RefObject<SafePolygonOptions | undefined>;
}

type HoverContextData = ContextData & {
  hoverInteractionState?: HoverInteractionSharedState | undefined;
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
