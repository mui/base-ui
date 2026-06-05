'use client';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { Timeout } from '@base-ui/utils/useTimeout';

import type { ContextData, FloatingRootContext, SafePolygonOptions } from '../types';
import { isInteractiveElement } from '../utils';

export { isInteractiveElement };

export class HoverInteraction {
  pointerType: string | undefined;
  interactedInside: boolean;
  handler: ((event: MouseEvent) => void) | undefined;
  blockMouseMove: boolean;
  performedPointerEventsMutation: boolean;
  pointerEventsScopeElement: HTMLElement | SVGSVGElement | null;
  pointerEventsReferenceElement: HTMLElement | SVGSVGElement | null;
  pointerEventsFloatingElement: HTMLElement | null;
  restTimeoutPending: boolean;
  openChangeTimeout: Timeout;
  restTimeout: Timeout;
  handleCloseOptions: SafePolygonOptions | undefined;
  handlerDocument: Document | undefined;

  constructor() {
    this.pointerType = undefined;
    this.interactedInside = false;
    this.handler = undefined;
    this.blockMouseMove = true;
    this.performedPointerEventsMutation = false;
    this.pointerEventsScopeElement = null;
    this.pointerEventsReferenceElement = null;
    this.pointerEventsFloatingElement = null;
    this.restTimeoutPending = false;
    this.openChangeTimeout = new Timeout();
    this.restTimeout = new Timeout();
    this.handleCloseOptions = undefined;
    this.handlerDocument = undefined;
  }

  static create(): HoverInteraction {
    return new HoverInteraction();
  }

  setMouseMoveHandler = (doc: Document, handler: (event: MouseEvent) => void) => {
    this.clearMouseMoveHandler();
    this.handler = handler;
    // Remember the document the listener was attached to. The reference element
    // (which we'd otherwise derive the document from) may be detached by the
    // time we clean up, so we must remove the listener from this exact document.
    this.handlerDocument = doc;
    doc.addEventListener('mousemove', handler);
  };

  clearMouseMoveHandler = () => {
    if (!this.handler) {
      return;
    }

    this.handlerDocument?.removeEventListener('mousemove', this.handler);
    this.handler = undefined;
    this.handlerDocument = undefined;
  };

  dispose = () => {
    this.openChangeTimeout.clear();
    this.restTimeout.clear();
    this.clearMouseMoveHandler();
  };

  reset = () => {
    this.dispose();
    // Match the normal close cleanup for detached hover triggers whose root unmounted.
    this.pointerType = undefined;
    this.interactedInside = false;
    this.restTimeoutPending = false;
    this.blockMouseMove = true;
    clearSafePolygonPointerEventsMutation(this);
  };

  disposeEffect = () => {
    return this.dispose;
  };
}

type PointerEventsMutationState = Pick<
  HoverInteraction,
  | 'performedPointerEventsMutation'
  | 'pointerEventsScopeElement'
  | 'pointerEventsReferenceElement'
  | 'pointerEventsFloatingElement'
>;

const pointerEventsMutationOwnerByScopeElement = new WeakMap<
  HTMLElement | SVGSVGElement,
  PointerEventsMutationState
>();

export function clearSafePolygonPointerEventsMutation(instance: PointerEventsMutationState) {
  if (!instance.performedPointerEventsMutation) {
    return;
  }

  const scopeElement = instance.pointerEventsScopeElement;

  if (scopeElement && pointerEventsMutationOwnerByScopeElement.get(scopeElement) === instance) {
    instance.pointerEventsScopeElement?.style.removeProperty('pointer-events');
    instance.pointerEventsReferenceElement?.style.removeProperty('pointer-events');
    instance.pointerEventsFloatingElement?.style.removeProperty('pointer-events');
    pointerEventsMutationOwnerByScopeElement.delete(scopeElement);
  }

  instance.performedPointerEventsMutation = false;
  instance.pointerEventsScopeElement = null;
  instance.pointerEventsReferenceElement = null;
  instance.pointerEventsFloatingElement = null;
}

export function applySafePolygonPointerEventsMutation(
  instance: PointerEventsMutationState,
  options: {
    scopeElement: HTMLElement | SVGSVGElement;
    referenceElement: HTMLElement | SVGSVGElement;
    floatingElement: HTMLElement;
  },
) {
  const { scopeElement, referenceElement, floatingElement } = options;

  const existingOwner = pointerEventsMutationOwnerByScopeElement.get(scopeElement);
  if (existingOwner && existingOwner !== instance) {
    clearSafePolygonPointerEventsMutation(existingOwner);
  }

  clearSafePolygonPointerEventsMutation(instance);
  instance.performedPointerEventsMutation = true;
  instance.pointerEventsScopeElement = scopeElement;
  instance.pointerEventsReferenceElement = referenceElement;
  instance.pointerEventsFloatingElement = floatingElement;
  pointerEventsMutationOwnerByScopeElement.set(scopeElement, instance);

  scopeElement.style.pointerEvents = 'none';
  referenceElement.style.pointerEvents = 'auto';
  floatingElement.style.pointerEvents = 'auto';
}

export type HoverContextData = ContextData & {
  hoverInteractionState?: HoverInteraction | undefined;
};

export function useHoverInteractionSharedState(store: FloatingRootContext): HoverInteraction {
  const data = store.context.dataRef.current as HoverContextData;
  const instance = useRefWithInit(
    () => data.hoverInteractionState ?? HoverInteraction.create(),
  ).current;

  if (!data.hoverInteractionState) {
    data.hoverInteractionState = instance;
  }

  useOnMount(data.hoverInteractionState.disposeEffect);

  return data.hoverInteractionState;
}
