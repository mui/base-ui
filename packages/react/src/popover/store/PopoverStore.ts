/* eslint-disable react-hooks/rules-of-hooks */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ReactStore, createSelector } from '@base-ui-components/utils/store';
import { Timeout } from '@base-ui-components/utils/useTimeout';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { useOnMount } from '@base-ui-components/utils/useOnMount';
import { type InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { EMPTY_OBJECT } from '@base-ui-components/utils/empty';
import { type FloatingRootContext } from '../../floating-ui-react';
import { type TransitionStatus } from '../../utils/useTransitionStatus';
import { FloatingUIOpenChangeDetails, type HTMLProps } from '../../utils/types';
import { getEmptyRootContext } from '../../floating-ui-react/utils/getEmptyRootContext';
import { PopoverRoot } from './../root/PopoverRoot';
import { REASONS } from '../../utils/reasons';
import { PopupTriggerMap } from '../../utils/popupStoreUtils';
import { PATIENT_CLICK_THRESHOLD } from '../../utils/constants';

export type State<Payload> = {
  readonly open: boolean;
  readonly mounted: boolean;
  readonly instantType: 'dismiss' | 'click' | undefined;
  readonly modal: boolean | 'trap-focus';
  readonly transitionStatus: TransitionStatus;
  readonly openMethod: InteractionType | null;
  readonly openReason: PopoverRoot.ChangeEventReason | null;
  readonly stickIfOpen: boolean;
  readonly nested: boolean;
  readonly titleElementId: string | undefined;
  readonly descriptionElementId: string | undefined;
  readonly activeTriggerId: string | null;
  readonly activeTriggerElement: HTMLElement | null;
  readonly positionerElement: HTMLElement | null;
  readonly popupElement: HTMLElement | null;
  readonly floatingRootContext: FloatingRootContext;
  readonly payload: Payload | undefined;

  readonly activeTriggerProps: HTMLProps;
  readonly inactiveTriggerProps: HTMLProps;
  readonly popupProps: HTMLProps;
};

type Context = {
  popupRef: React.RefObject<HTMLElement | null>;
  backdropRef: React.RefObject<HTMLDivElement | null>;
  internalBackdropRef: React.RefObject<HTMLDivElement | null>;
  onOpenChange: ((open: boolean, eventDetails: PopoverRoot.ChangeEventDetails) => void) | undefined;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
  triggerFocusTargetRef: React.RefObject<HTMLElement | null>;
  beforeContentFocusGuardRef: React.RefObject<HTMLElement | null>;
  preventUnmountingRef: React.RefObject<boolean>;
  stickIfOpenTimeout: Timeout;
  triggerElements: PopupTriggerMap;
};

function createInitialState<Payload>(): State<Payload> {
  return {
    open: false,
    mounted: false,
    modal: false,
    activeTriggerId: null,
    activeTriggerElement: null,
    positionerElement: null,
    popupElement: null,
    instantType: undefined,
    transitionStatus: 'idle',
    openMethod: null,
    openReason: null,
    titleElementId: undefined,
    descriptionElementId: undefined,
    floatingRootContext: getEmptyRootContext(),
    payload: undefined,
    activeTriggerProps: EMPTY_OBJECT as HTMLProps,
    inactiveTriggerProps: EMPTY_OBJECT as HTMLProps,
    popupProps: EMPTY_OBJECT as HTMLProps,
    stickIfOpen: true,
    nested: false,
  };
}

const selectors = {
  open: createSelector((state: State<unknown>) => state.open),
  mounted: createSelector((state: State<unknown>) => state.mounted),

  activeTriggerId: createSelector((state: State<unknown>) => state.activeTriggerId),
  activeTriggerElement: createSelector((state: State<unknown>) =>
    state.mounted ? state.activeTriggerElement : null,
  ),
  positionerElement: createSelector((state: State<unknown>) => state.positionerElement),
  popupElement: createSelector((state: State<unknown>) => state.popupElement),

  instantType: createSelector((state: State<unknown>) => state.instantType),
  transitionStatus: createSelector((state: State<unknown>) => state.transitionStatus),
  openMethod: createSelector((state: State<unknown>) => state.openMethod),
  openReason: createSelector((state: State<unknown>) => state.openReason),

  modal: createSelector((state: State<unknown>) => state.modal),
  stickIfOpen: createSelector((state: State<unknown>) => state.stickIfOpen),
  floatingRootContext: createSelector((state: State<unknown>) => state.floatingRootContext),

  titleElementId: createSelector((state: State<unknown>) => state.titleElementId),
  descriptionElementId: createSelector((state: State<unknown>) => state.descriptionElementId),

  payload: createSelector((state: State<unknown>) => state.payload),

  isTriggerActive: createSelector(
    (state: State<unknown>, triggerId: string | undefined) =>
      triggerId !== undefined && state.activeTriggerId === triggerId,
  ),
  isOpenedByTrigger: createSelector(
    (state: State<unknown>, triggerId: string | undefined) =>
      triggerId !== undefined && state.activeTriggerId === triggerId && state.open,
  ),

  triggerProps: createSelector((state: State<unknown>, isActive: boolean) =>
    isActive ? state.activeTriggerProps : state.inactiveTriggerProps,
  ),
  popupProps: createSelector((state: State<unknown>) => state.popupProps),
};

export class PopoverStore<Payload> extends ReactStore<State<Payload>, Context, Selectors> {
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
        preventUnmountingRef: { current: false },
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
      this.context.preventUnmountingRef.current = true;
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
      this.set('open', nextOpen);

      if (nextOpen) {
        this.set('openReason', eventDetails.reason ?? null);
      }

      // If a popup is closing, the `trigger` may be null.
      // We want to keep the previous value so that exit animations are played and focus is returned correctly.
      const newTriggerId = eventDetails.trigger?.id ?? null;
      if (newTriggerId || nextOpen) {
        this.set('activeTriggerId', newTriggerId);
        this.set('activeTriggerElement', eventDetails.trigger ?? null);
      }
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
    const store = useRefWithInit(() => {
      return externalStore ?? new PopoverStore<Payload>(initialState);
    }).current;

    useOnMount(store.disposeEffect);
    return store;
  }

  private disposeEffect = () => {
    return this.context.stickIfOpenTimeout.disposeEffect();
  };
}

type Selectors = typeof selectors;
