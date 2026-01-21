/* eslint-disable react-hooks/rules-of-hooks */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ReactStore, createSelector } from '@base-ui/utils/store';
import { Timeout } from '@base-ui/utils/useTimeout';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { type InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { FloatingUIOpenChangeDetails } from '../../utils/types';
import { PopoverRoot } from './../root/PopoverRoot';
import { REASONS } from '../../utils/reasons';
import {
  createInitialPopupStoreState,
  PopupStoreContext,
  popupStoreSelectors,
  PopupStoreState,
  PopupTriggerMap,
} from '../../utils/popups';
import { PATIENT_CLICK_THRESHOLD } from '../../utils/constants';

export type State<Payload> = PopupStoreState<Payload> & {
  disabled: boolean;
  instantType: 'dismiss' | 'click' | undefined;
  modal: boolean | 'trap-focus';
  openMethod: InteractionType | null;
  openChangeReason: PopoverRoot.ChangeEventReason | null;
  stickIfOpen: boolean;
  nested: boolean;
  titleElementId: string | undefined;
  descriptionElementId: string | undefined;
  openOnHover: boolean;
  closeDelay: number;
  hasViewport: boolean;
};

type Context = PopupStoreContext<PopoverRoot.ChangeEventDetails> & {
  readonly popupRef: React.RefObject<HTMLElement | null>;
  readonly backdropRef: React.RefObject<HTMLDivElement | null>;
  readonly internalBackdropRef: React.RefObject<HTMLDivElement | null>;
  readonly triggerFocusTargetRef: React.RefObject<HTMLElement | null>;
  readonly beforeContentFocusGuardRef: React.RefObject<HTMLElement | null>;
  readonly stickIfOpenTimeout: Timeout;
};

function createInitialState<Payload>(): State<Payload> {
  return {
    ...createInitialPopupStoreState(),
    disabled: false,
    modal: false,
    instantType: undefined,
    openMethod: null,
    openChangeReason: null,
    titleElementId: undefined,
    descriptionElementId: undefined,
    stickIfOpen: true,
    nested: false,
    openOnHover: false,
    closeDelay: 0,
    hasViewport: false,
  };
}

const selectors = {
  ...popupStoreSelectors,
  disabled: createSelector((state: State<unknown>) => state.disabled),
  instantType: createSelector((state: State<unknown>) => state.instantType),
  openMethod: createSelector((state: State<unknown>) => state.openMethod),
  openChangeReason: createSelector((state: State<unknown>) => state.openChangeReason),
  modal: createSelector((state: State<unknown>) => state.modal),
  stickIfOpen: createSelector((state: State<unknown>) => state.stickIfOpen),
  titleElementId: createSelector((state: State<unknown>) => state.titleElementId),
  descriptionElementId: createSelector((state: State<unknown>) => state.descriptionElementId),
  openOnHover: createSelector((state: State<unknown>) => state.openOnHover),
  closeDelay: createSelector((state: State<unknown>) => state.closeDelay),
  hasViewport: createSelector((state: State<unknown>) => state.hasViewport),
};

export class PopoverStore<Payload> extends ReactStore<
  Readonly<State<Payload>>,
  Context,
  Selectors
> {
  constructor(initialState?: Partial<State<Payload>>) {
    const initial = { ...createInitialState<Payload>(), ...initialState };

    if (initial.open && initialState?.mounted === undefined) {
      initial.mounted = true;
    }

    super(
      initial,
      {
        popupRef: React.createRef<HTMLElement>(),
        backdropRef: React.createRef<HTMLDivElement>(),
        internalBackdropRef: React.createRef<HTMLDivElement>(),
        onOpenChange: undefined,
        onOpenChangeComplete: undefined,
        triggerFocusTargetRef: React.createRef<HTMLElement>(),
        beforeContentFocusGuardRef: React.createRef<HTMLElement>(),
        stickIfOpenTimeout: new Timeout(),
        triggerElements: new PopupTriggerMap(),
      },
      selectors,
    );
  }

  setOpen = (
    nextOpen: boolean,
    eventDetails: Omit<PopoverRoot.ChangeEventDetails, 'preventUnmountOnClose'>,
  ) => {
    const isHover = eventDetails.reason === REASONS.triggerHover;
    const isKeyboardClick =
      eventDetails.reason === REASONS.triggerPress &&
      (eventDetails.event as MouseEvent).detail === 0;
    const isDismissClose =
      !nextOpen && (eventDetails.reason === REASONS.escapeKey || eventDetails.reason == null);

    (eventDetails as PopoverRoot.ChangeEventDetails).preventUnmountOnClose = () => {
      this.set('preventUnmountingOnClose', true);
    };

    this.context.onOpenChange?.(nextOpen, eventDetails as PopoverRoot.ChangeEventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    const details: FloatingUIOpenChangeDetails = {
      open: nextOpen,
      nativeEvent: eventDetails.event,
      reason: eventDetails.reason,
      nested: this.state.nested,
      triggerElement: eventDetails.trigger,
    };

    const floatingEvents = this.state.floatingRootContext.context.events;
    floatingEvents?.emit('openchange', details);

    const changeState = () => {
      const updatedState: Partial<State<Payload>> = {
        open: nextOpen,
        openChangeReason: eventDetails.reason,
      };

      // If a popup is closing, the `trigger` may be null.
      // We want to keep the previous value so that exit animations are played and focus is returned correctly.
      const newTriggerId = eventDetails.trigger?.id ?? null;
      if (newTriggerId || nextOpen) {
        updatedState.activeTriggerId = newTriggerId;
        updatedState.activeTriggerElement = eventDetails.trigger ?? null;
      }

      this.update(updatedState);
    };

    if (isHover) {
      // Only allow "patient" clicks to close the popover if it's open.
      // If they clicked within 500ms of the popover opening, keep it open.
      this.set('stickIfOpen', true);
      this.context.stickIfOpenTimeout.start(PATIENT_CLICK_THRESHOLD, () => {
        this.set('stickIfOpen', false);
      });

      ReactDOM.flushSync(changeState);
    } else {
      changeState();
    }

    if (isKeyboardClick || isDismissClose) {
      this.set('instantType', isKeyboardClick ? 'click' : 'dismiss');
    } else if (eventDetails.reason === REASONS.focusOut) {
      this.set('instantType', 'focus');
    } else {
      this.set('instantType', undefined);
    }
  };

  public static useStore<Payload>(
    externalStore: PopoverStore<Payload> | undefined,
    initialState: Partial<State<Payload>>,
  ) {
    const internalStore = useRefWithInit(() => {
      return new PopoverStore<Payload>(initialState);
    }).current;

    const store = externalStore ?? internalStore;

    useOnMount(internalStore.disposeEffect);
    return store;
  }

  private disposeEffect = () => {
    return this.context.stickIfOpenTimeout.disposeEffect();
  };
}

type Selectors = typeof selectors;
