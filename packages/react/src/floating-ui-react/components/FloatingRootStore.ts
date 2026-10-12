import type * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import type { FloatingEvents, ContextData, ReferenceType } from '../types';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { createEventEmitter } from '../utils/createEventEmitter';
import type { FloatingUIOpenChangeDetails } from '../../internals/types';
import type { PopupTriggerMap } from '../../utils/popups';
import { isClickLikeEvent } from '../utils';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { FocusRoute } from '../utils/focusRoute';

export interface FloatingRootState {
  open: boolean;
  transitionStatus: TransitionStatus | undefined;
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
    ((open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void) | undefined;
  readonly dataRef: React.RefObject<ContextData>;
  readonly events: FloatingEvents;
  nested: boolean;
  readonly triggerElements: PopupTriggerMap;
}

const selectors = {
  open: (state: FloatingRootState) => state.open,
  transitionStatus: (state: FloatingRootState) => state.transitionStatus,
  domReferenceElement: (state: FloatingRootState) => state.domReferenceElement,
  referenceElement: (state: FloatingRootState) => state.positionReference ?? state.referenceElement,
  floatingElement: (state: FloatingRootState) => state.floatingElement,
  floatingId: (state: FloatingRootState) => state.floatingId,
};

interface FloatingRootStoreOptions {
  open: boolean;
  transitionStatus: TransitionStatus | undefined;
  referenceElement: ReferenceType | null;
  floatingElement: HTMLElement | null;
  triggerElements: PopupTriggerMap;
  floatingId: string | undefined;
  nested: boolean;
  onOpenChange:
    ((open: boolean, eventDetails: BaseUIChangeEventDetails<string>) => void) | undefined;
}

export class FloatingRootStore extends ReactStore<
  Readonly<FloatingRootState>,
  FloatingRootStoreContext,
  typeof selectors
> {
  /** Read and written only through the close request functions below. */
  declare closeRequest: CloseRequest | undefined;

  /** The popup's focus route, created by `getFocusRoute`. */
  declare focusRoute: FocusRoute | undefined;

  constructor(options: FloatingRootStoreOptions) {
    const { nested, onOpenChange, triggerElements, ...initialState } = options;

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
        triggerElements,
      },
      selectors,
    );
  }

  /**
   * Syncs the event used by hover logic to distinguish hover-open from click-like interaction.
   */
  syncOpenEvent = (newOpen: boolean, event: Event | undefined) => {
    if (
      !newOpen ||
      !this.state.open ||
      // Prevent a pending hover-open from overwriting a click-open event, while allowing
      // click events to upgrade a hover-open.
      (event != null && isClickLikeEvent(event))
    ) {
      this.context.dataRef.current.openEvent = newOpen ? event : undefined;
    }
  };

  /**
   * Runs the root-owned side effects for an open state change: records a close request and emits
   * `openchange`. The owner of the open state calls it once it accepts the change.
   *
   * @param record Whether a close is recorded as a close request. A change that clears a pending
   *   open without closing anything isn't one.
   */
  dispatchOpenChange = (
    newOpen: boolean,
    eventDetails: BaseUIChangeEventDetails<string>,
    record = true,
  ) => {
    this.syncOpenEvent(newOpen, eventDetails.event);

    const details: FloatingUIOpenChangeDetails = {
      open: newOpen,
      reason: eventDetails.reason,
      nativeEvent: eventDetails.event,
      nested: this.context.nested,
      triggerElement: eventDetails.trigger,
    };

    // The store outlives the focus manager, so a consumer that unmounts the popup inside
    // `onOpenChange` can't lose the request.
    if (record) {
      recordCloseRequest(this, details);
    }

    this.context.events.emit('openchange', details);
  };

  /**
   * Requests an open state change from the owner of the open state through `onOpenChange`. The
   * owner decides whether to accept it, and calls `dispatchOpenChange` when it does.
   *
   * @param newOpen The new open state.
   * @param eventDetails Details about the event that triggered the open state change.
   */
  setOpen = (newOpen: boolean, eventDetails: BaseUIChangeEventDetails<string>) => {
    this.context.onOpenChange?.(newOpen, eventDetails);
  };
}

/*
 * Close requests: the latest close dispatched to a floating root that `FloatingFocusManager`
 * hasn't used yet, and the rules that expire it.
 *
 * - `dispatchOpenChange` records every open change. A close replaces the pending request; an open
 *   leaves it, since a reopen can be dispatched before the focus manager sees the close.
 * - While its popup is open, the focus manager reports input and focus moves. Once the close has
 *   committed, its return job takes the request.
 * - A focus session marks the pending request when it starts and takes only a newer one. No
 *   session boundary has to clear the request: one made before a session never leaks into it, and
 *   a reopen's session can't erase the request its predecessor's job is about to take.
 *
 * Plain functions rather than methods, so roots without a focus manager carry only the writer.
 */

export interface CloseRequest {
  details: FloatingUIOpenChangeDetails;
  /** Focus moved (`focusin`) while the request was pending. */
  moved?: boolean | undefined;
}

/**
 * The request pending when the mark was taken. Each close records a new object, and a request
 * never becomes pending again once replaced, expired or taken, so any other pending one is newer.
 */
export type CloseRequestMark = CloseRequest | undefined;

/** The single writer. */
export function recordCloseRequest(store: FloatingRootStore, details: FloatingUIOpenChangeDetails) {
  if (!details.open) {
    store.closeRequest = { details };
  }
}

export function markCloseRequest(store: FloatingRootStore): CloseRequestMark {
  return store.closeRequest;
}

/** Input while open expires a request it didn't make (a refused one, say). */
export function invalidateCloseRequest(store: FloatingRootStore, event: Event) {
  if (store.closeRequest?.details.nativeEvent !== event) {
    store.closeRequest = undefined;
  }
}

/** Focus moved (`focusin`) while open. */
export function noteFocusMove(store: FloatingRootStore) {
  if (store.closeRequest) {
    store.closeRequest.moved = true;
  }
}

/** Whether a request newer than `mark` is pending. */
export function hasCloseRequestSince(store: FloatingRootStore, mark: CloseRequestMark) {
  return !!store.closeRequest && store.closeRequest !== mark;
}

/** Takes the pending request if it is newer than `mark`. */
export function takeCloseRequest(
  store: FloatingRootStore,
  mark: CloseRequestMark,
): CloseRequest | undefined {
  const request = store.closeRequest;
  if (request && request !== mark) {
    store.closeRequest = undefined;
    return request;
  }
  return undefined;
}
