import * as React from 'react';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { useTimeout, Timeout } from '@base-ui-components/utils/useTimeout';

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
  hoverInteractionState?: HoverInteraction;
};

class HoverInteraction {
  pointerTypeRef: string | undefined;
  interactedInsideRef: boolean;
  handlerRef: ((event: MouseEvent) => void) | undefined;
  blockMouseMoveRef: boolean;
  performedPointerEventsMutationRef: boolean;
  unbindMouseMoveRef: () => void;
  restTimeoutPendingRef: boolean;
  openChangeTimeout: Timeout;
  restTimeout: Timeout;
  handleCloseOptionsRef: SafePolygonOptions | undefined;

  constructor() {
    this.pointerTypeRef = undefined;
    this.interactedInsideRef = false;
    this.handlerRef = undefined;
    this.blockMouseMoveRef = true;
    this.performedPointerEventsMutationRef = false;
    this.unbindMouseMoveRef = () => {};
    this.restTimeoutPendingRef = false;
    this.openChangeTimeout = new Timeout();
    this.restTimeout = new Timeout();
    this.handleCloseOptionsRef = undefined;
  }

  static create(): HoverInteraction {
    return new HoverInteraction();
  }
}

export function useHoverInteractionSharedState(store: FloatingRootContext): HoverInteraction {
  const instance = useRefWithInit(HoverInteraction.create).current;

  const data = store.context.dataRef.current as HoverContextData;
  if (!data.hoverInteractionState) {
    data.hoverInteractionState = instance;
  }

  return instance;
}
