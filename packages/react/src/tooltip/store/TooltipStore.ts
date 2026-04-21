import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createSelector, ReactStore } from '@base-ui/utils/store';
import { type TooltipRoot } from '../root/TooltipRoot';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import {
  createPopupFloatingRootContext,
  createInitialPopupStoreState,
  PopupStoreContext,
  popupStoreSelectors,
  PopupStoreState,
  PopupTriggerMap,
  setOpenTriggerState,
  usePopupStore,
} from '../../utils/popups';

export type State<Payload> = PopupStoreState<Payload> & {
  disabled: boolean;
  instantType: 'delay' | 'dismiss' | 'focus' | undefined;
  isInstantPhase: boolean;
  trackCursorAxis: 'none' | 'x' | 'y' | 'both';
  disableHoverablePopup: boolean;
  openChangeReason: TooltipRoot.ChangeEventReason | null;
  closeOnClick: boolean;
  closeDelay: number;
  hasViewport: boolean;
};

export type Context = PopupStoreContext<TooltipRoot.ChangeEventDetails> & {
  readonly popupRef: React.RefObject<HTMLElement | null>;
};

const selectors = {
  ...popupStoreSelectors,
  disabled: createSelector((state: State<unknown>) => state.disabled),
  instantType: createSelector((state: State<unknown>) => state.instantType),
  isInstantPhase: createSelector((state: State<unknown>) => state.isInstantPhase),
  trackCursorAxis: createSelector((state: State<unknown>) => state.trackCursorAxis),
  disableHoverablePopup: createSelector((state: State<unknown>) => state.disableHoverablePopup),
  lastOpenChangeReason: createSelector((state: State<unknown>) => state.openChangeReason),
  closeOnClick: createSelector((state: State<unknown>) => state.closeOnClick),
  closeDelay: createSelector((state: State<unknown>) => state.closeDelay),
  hasViewport: createSelector((state: State<unknown>) => state.hasViewport),
};

export class TooltipStore<Payload> extends ReactStore<
  Readonly<State<Payload>>,
  Context,
  typeof selectors
> {
  constructor(initialState?: Partial<State<Payload>>, floatingId?: string, nested?: boolean) {
    const triggerElements = new PopupTriggerMap();
    const state = { ...createInitialState<Payload>(), ...initialState };
    state.floatingRootContext = createPopupFloatingRootContext(triggerElements, floatingId, nested);

    super(
      state,
      {
        popupRef: React.createRef<HTMLElement | null>(),
        onOpenChange: undefined,
        onOpenChangeComplete: undefined,
        triggerElements,
      },
      selectors,
    );
  }

  setOpen = (
    nextOpen: boolean,
    eventDetails: Omit<TooltipRoot.ChangeEventDetails, 'preventUnmountOnClose'>,
  ) => {
    const currentOpen = this.state.openProp ?? this.state.open;
    const reason = eventDetails.reason;
    const nextTriggerId = eventDetails.trigger?.id ?? null;
    const currentTriggerId = this.state.activeTriggerId;

    const isAlreadyClosed = !currentOpen && !nextOpen;
    const isAlreadyOpenByThisTrigger =
      currentOpen && nextOpen && this.state.open && nextTriggerId === currentTriggerId;

    if (isAlreadyClosed || isAlreadyOpenByThisTrigger) {
      return;
    }

    const isHover = reason === REASONS.triggerHover;
    const isFocusOpen = nextOpen && reason === REASONS.triggerFocus;
    const isDismissClose =
      !nextOpen && (reason === REASONS.triggerPress || reason === REASONS.escapeKey);

    (eventDetails as TooltipRoot.ChangeEventDetails).preventUnmountOnClose = () => {
      this.set('preventUnmountingOnClose', true);
    };

    this.context.onOpenChange?.(nextOpen, eventDetails as TooltipRoot.ChangeEventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    this.state.floatingRootContext.dispatchOpenChange(nextOpen, eventDetails);

    const changeState = () => {
      const updatedState: Partial<State<Payload>> = { open: nextOpen, openChangeReason: reason };

      if (isFocusOpen) {
        updatedState.instantType = 'focus';
      } else if (isDismissClose) {
        updatedState.instantType = 'dismiss';
      } else if (reason === REASONS.triggerHover) {
        updatedState.instantType = undefined;
      }

      setOpenTriggerState(updatedState, nextOpen, eventDetails.trigger);

      this.update(updatedState);
    };

    if (isHover) {
      // If a hover reason is provided, we need to flush the state synchronously. This ensures
      // `node.getAnimations()` knows about the new state.
      ReactDOM.flushSync(changeState);
    } else {
      changeState();
    }
  };

  cancelPendingOpen(event: MouseEvent | PointerEvent) {
    this.state.floatingRootContext.dispatchOpenChange(
      false,
      createChangeEventDetails(REASONS.triggerPress, event),
    );
  }

  static useStore<Payload>(
    externalStore: TooltipStore<Payload> | undefined,
    initialState?: Partial<State<Payload>>,
  ) {
    /* eslint-disable react-hooks/rules-of-hooks */
    const { store } = usePopupStore(
      externalStore,
      (floatingId, nested) => new TooltipStore<Payload>(initialState, floatingId, nested),
    );
    /* eslint-enable react-hooks/rules-of-hooks */

    return store;
  }
}

function createInitialState<Payload>(): State<Payload> {
  return {
    ...createInitialPopupStoreState(),
    disabled: false,
    instantType: undefined,
    isInstantPhase: false,
    trackCursorAxis: 'none',
    disableHoverablePopup: false,
    openChangeReason: null,
    closeOnClick: true,
    closeDelay: 0,
    hasViewport: false,
  };
}
