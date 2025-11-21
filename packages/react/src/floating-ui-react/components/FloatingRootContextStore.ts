import * as React from 'react';
import { createSelector, ReactStore } from '@base-ui-components/utils/store';
import { NOOP } from '@base-ui-components/utils/empty';
import type { FloatingEvents, ContextData, ReferenceType } from '../types';
import { type BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { createEventEmitter } from '../utils/createEventEmitter';
import { type FloatingUIOpenChangeDetails } from '../../utils/types';

export interface FloatingRootContextState<RT extends ReferenceType = ReferenceType> {
  open: boolean;
  domReferenceElement: Element | null;
  referenceElement: RT | null;
  floatingElement: HTMLElement | null;
  triggerElements: Element[] | undefined;
  positionReference: ReferenceType | null;
  floatingId: string | undefined;
}

export interface FloatingRootContextContext {
  onOpenChange:
    | ((open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void)
    | undefined;
  dataRef: React.RefObject<ContextData>;
  setPositionReference(node: ReferenceType | null): void;
  events: FloatingEvents;
  noEmit: boolean;
  nested: boolean;
}

const selectors = {
  open: createSelector((state: FloatingRootContextState) => state.open),
  domReferenceElement: createSelector(
    (state: FloatingRootContextState) => state.domReferenceElement,
  ),
  referenceElement: createSelector(
    (state: FloatingRootContextState) => state.positionReference ?? state.referenceElement,
  ),
  floatingElement: createSelector((state: FloatingRootContextState) => state.floatingElement),
  triggerElements: createSelector((state: FloatingRootContextState) => state.triggerElements),
  floatingId: createSelector((state: FloatingRootContextState) => state.floatingId),
};

interface FloatingRootContextOptions<RT extends ReferenceType = ReferenceType> {
  open: boolean;
  referenceElement: RT | null;
  floatingElement: HTMLElement | null;
  triggerElements: Element[] | undefined;
  floatingId: string | undefined;
  nested: boolean;
  noEmit: boolean;
  onOpenChange:
    | ((open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void)
    | undefined;
}

export class FloatingRootContextStore<RT extends ReferenceType = ReferenceType> extends ReactStore<
  FloatingRootContextState<RT>,
  FloatingRootContextContext,
  typeof selectors
> {
  constructor(options: FloatingRootContextOptions<RT>) {
    const { nested, noEmit, onOpenChange, ...initialState } = options;

    super(
      {
        ...initialState,
        positionReference: initialState.referenceElement,
        domReferenceElement: initialState.referenceElement as Element | null,
      },
      {
        onOpenChange,
        setPositionReference: NOOP,
        dataRef: { current: {} },
        events: createEventEmitter(),
        noEmit,
        nested,
      },
      selectors,
    );
  }

  setOpen = (newOpen: boolean, eventDetails: BaseUIChangeEventDetails<string>) => {
    this.context.dataRef.current.openEvent = newOpen ? eventDetails.event : undefined;
    if (!this.context.noEmit) {
      const details: FloatingUIOpenChangeDetails = {
        open: newOpen,
        reason: eventDetails.reason,
        nativeEvent: eventDetails.event,
        nested: this.context.nested,
        triggerElement: eventDetails.trigger,
      };
      this.context.events.emit('openchange', details);
    }

    this.context.onOpenChange?.(newOpen, eventDetails);
  };
}
