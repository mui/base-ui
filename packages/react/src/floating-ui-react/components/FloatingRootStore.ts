import * as React from 'react';
import { createSelector, ReactStore } from '@base-ui/utils/store';
import type { FloatingEvents, ContextData, ReferenceType } from '../types';
import { type BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { createEventEmitter } from '../utils/createEventEmitter';
import { type FloatingUIOpenChangeDetails } from '../../utils/types';
import { type PopupTriggerMap } from '../../utils/popups';
import { isClickLikeEvent } from '../utils';

export interface FloatingRootState {
  open: boolean;
  domReferenceElement: Element | null;
  referenceElement: ReferenceType | null;
  floatingElement: HTMLElement | null;
  positionReference: ReferenceType | null;
  /**
   * The ID of the floating element.
   */
  floatingId: string | undefined;
}

export interface FloatingRootStoreContext {
  onOpenChange:
    | ((open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void)
    | undefined;
  readonly dataRef: React.RefObject<ContextData>;
  readonly events: FloatingEvents;
  nested: boolean;
  noEmit: boolean;
  readonly triggerElements: PopupTriggerMap;
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
  triggerElements: PopupTriggerMap;
  floatingId: string | undefined;
  nested: boolean;
  noEmit: boolean;
  onOpenChange:
    | ((open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void)
    | undefined;
}

export class FloatingRootStore extends ReactStore<
  Readonly<FloatingRootState>,
  FloatingRootStoreContext,
  typeof selectors
> {
  constructor(options: FloatingRootStoreOptions) {
    const { nested, noEmit, onOpenChange, triggerElements, ...initialState } = options;

    super(
      {
        ...initialState,
        positionReference: initialState.referenceElement,
        domReferenceElement: initialState.referenceElement as Element | null,
      },
      {
        onOpenChange,
        dataRef: { current: {} },
        events: createEventEmitter(),
        nested,
        noEmit,
        triggerElements,
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
    if (
      !newOpen ||
      !this.state.open ||
      // Prevent a pending hover-open from overwriting a click-open event, while allowing
      // click events to upgrade a hover-open.
      isClickLikeEvent(eventDetails.event)
    ) {
      this.context.dataRef.current.openEvent = newOpen ? eventDetails.event : undefined;
    }
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
