import * as React from 'react';
import { createSelector, ReactStore } from '@base-ui-components/utils/store';
import { NOOP } from '@base-ui-components/utils/empty';
import type { FloatingEvents, ContextData, ReferenceType } from '../types';
import { type BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { createEventEmitter } from '../utils/createEventEmitter';
import { type FloatingUIOpenChangeDetails } from '../../utils/types';

export interface FloatingRootState {
  readonly open: boolean;
  readonly domReferenceElement: Element | null;
  readonly referenceElement: ReferenceType | null;
  readonly floatingElement: HTMLElement | null;
  readonly positionReference: ReferenceType | null;
  /**
   * The ID of the floating element.
   */
  readonly floatingId: string | undefined;
}

export interface FloatingRootStoreContext {
  onOpenChange:
    | ((open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void)
    | undefined;
  dataRef: React.RefObject<ContextData>;
  setPositionReference(node: ReferenceType | null): void;
  events: FloatingEvents;
  nested: boolean;
  noEmit: boolean;
  getTriggers(): Set<Element>;
}

const selectors = {
  open: createSelector((state: FloatingRootState) => state.open),
  domReferenceElement: createSelector((state: FloatingRootState) => state.domReferenceElement),
  referenceElement: createSelector(
    (state: FloatingRootState) => state.positionReference ?? state.referenceElement,
  ),
  floatingElement: createSelector((state: FloatingRootState) => state.floatingElement),
  floatingId: createSelector((state: FloatingRootState) => state.floatingId),
};

interface FloatingRootStoreOptions {
  open: boolean;
  referenceElement: ReferenceType | null;
  floatingElement: HTMLElement | null;
  triggersGetter: () => Set<Element>;
  floatingId: string | undefined;
  nested: boolean;
  noEmit: boolean;
  onOpenChange:
    | ((open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void)
    | undefined;
}

export class FloatingRootStore extends ReactStore<
  FloatingRootState,
  FloatingRootStoreContext,
  typeof selectors
> {
  constructor(options: FloatingRootStoreOptions) {
    const { nested, noEmit, onOpenChange, triggersGetter, ...initialState } = options;

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
        nested,
        noEmit,
        getTriggers: triggersGetter,
      },
      selectors,
    );
  }

  /**
   * Emits the `openchange` event through the internal event emitter and calls the `onOpenChange` handler with the provided arguments.
   *
   * @param newOpen The new open state.
   * @param eventDetails Details about the event that triggered the open state change.
   */
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
