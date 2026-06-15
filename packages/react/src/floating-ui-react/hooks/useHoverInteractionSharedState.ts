'use client';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { Timeout } from '@base-ui/utils/useTimeout';

import type { ContextData, FloatingRootContext, SafePolygonOptions } from '../types';
import { isInteractiveElement } from '../utils';

export { isInteractiveElement };

export class HoverInteraction {
  pointerType: string | undefined = undefined;
  interactedInside = false;
  handler: ((event: MouseEvent) => void) | undefined = undefined;
  blockMouseMove = true;
  performedPointerEventsMutation = false;
  pointerEventsScopeElement: HTMLElement | SVGSVGElement | null = null;
  pointerEventsReferenceElement: HTMLElement | SVGSVGElement | null = null;
  pointerEventsFloatingElement: HTMLElement | null = null;
  restTimeoutPending = false;
  openChangeTimeout = new Timeout();
  restTimeout = new Timeout();
  handleCloseOptions: SafePolygonOptions | undefined = undefined;

  // The instance is shared (via the root's `dataRef`) by every trigger and the
  // popup, each of which mounts and unmounts independently. Ref-count the
  // consumers so the pending timers are only cleared once the last one unmounts,
  // not whenever any single consumer does (which would cancel another's pending
  // open/close).
  private refCount = 0;

  retain = () => {
    this.refCount += 1;
    return () => {
      this.refCount -= 1;
      if (this.refCount === 0) {
        this.openChangeTimeout.clear();
        this.restTimeout.clear();
      }
    };
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

type HoverContextData = ContextData & {
  hoverInteractionState?: HoverInteraction | undefined;
};

export function useHoverInteractionSharedState(store: FloatingRootContext): HoverInteraction {
  const data = store.context.dataRef.current as HoverContextData;
  const instance = useRefWithInit(
    () => data.hoverInteractionState ?? new HoverInteraction(),
  ).current;

  if (!data.hoverInteractionState) {
    data.hoverInteractionState = instance;
  }

  useOnMount(data.hoverInteractionState.retain);

  return data.hoverInteractionState;
}
