import * as React from 'react';
import { ReactStore, createSelector } from '@base-ui-components/utils/store';
import { type InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { EMPTY_OBJECT } from '@base-ui-components/utils/empty';
import { type FloatingRootContext } from '../floating-ui-react';
import { type TransitionStatus } from '../utils/useTransitionStatus';
import { type PopupTriggerMap, type HTMLProps } from '../utils/types';
import { getEmptyContext } from '../floating-ui-react/hooks/useFloatingRootContext';
import { PopoverRoot } from './root/PopoverRoot';

export type State = {
  open: boolean;
  mounted: boolean;
  instantType: 'dismiss' | 'click' | undefined;
  modal: boolean | 'trap-focus';
  transitionStatus: TransitionStatus;
  openMethod: InteractionType | null;
  openReason: PopoverRoot.ChangeEventReason | null;
  stickIfOpen: boolean;

  titleElementId: string | undefined;
  descriptionElementId: string | undefined;
  activeTriggerId: string | null;
  positionerElement: HTMLElement | null;
  popupElement: HTMLElement | null;
  triggers: PopupTriggerMap;

  floatingRootContext: FloatingRootContext;

  payload: unknown | undefined;

  activeTriggerProps: HTMLProps;
  inactiveTriggerProps: HTMLProps;
  popupProps: HTMLProps;
};

type Context = {
  popupRef: React.RefObject<HTMLElement | null>;
  backdropRef: React.RefObject<HTMLDivElement | null>;
  internalBackdropRef: React.RefObject<HTMLDivElement | null>;
  onOpenChange: ((open: boolean, eventDetails: PopoverRoot.ChangeEventDetails) => void) | undefined;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
  triggerFocusTargetRef: React.RefObject<HTMLElement | null>;
  beforeContentFocusGuardRef: React.RefObject<HTMLElement | null>;
};

function createInitialState<Payload>(): State {
  return {
    open: false,
    mounted: false,
    modal: false,
    activeTriggerId: null,
    positionerElement: null,
    popupElement: null,
    triggers: new Map<string, { element: HTMLElement; getPayload?: (() => Payload) | undefined }>(),
    instantType: undefined,
    transitionStatus: 'idle',
    openMethod: null,
    openReason: null,
    titleElementId: undefined,
    descriptionElementId: undefined,
    floatingRootContext: getEmptyContext(),
    payload: undefined,
    activeTriggerProps: EMPTY_OBJECT as HTMLProps,
    inactiveTriggerProps: EMPTY_OBJECT as HTMLProps,
    popupProps: EMPTY_OBJECT as HTMLProps,
    stickIfOpen: true,
  };
}

const selectors = {
  open: createSelector((state: State) => state.open),
  mounted: createSelector((state: State) => state.mounted),

  activeTriggerId: createSelector((state: State) => state.activeTriggerId),
  activeTriggerElement: createSelector((state: State) =>
    state.mounted && state.activeTriggerId != null
      ? (state.triggers.get(state.activeTriggerId)?.element ?? null)
      : null,
  ),
  positionerElement: createSelector((state: State) => state.positionerElement),
  popupElement: createSelector((state: State) => state.popupElement),
  triggers: createSelector((state: State) => state.triggers),

  instantType: createSelector((state: State) => state.instantType),
  transitionStatus: createSelector((state: State) => state.transitionStatus),
  openMethod: createSelector((state: State) => state.openMethod),
  openReason: createSelector((state: State) => state.openReason),

  modal: createSelector((state: State) => state.modal),
  stickIfOpen: createSelector((state: State) => state.stickIfOpen),
  floatingRootContext: createSelector((state: State) => state.floatingRootContext),

  titleElementId: createSelector((state: State) => state.titleElementId),
  descriptionElementId: createSelector((state: State) => state.descriptionElementId),

  payload: createSelector((state: State) => state.payload),

  activeTriggerProps: createSelector((state: State) => state.activeTriggerProps),
  inactiveTriggerProps: createSelector((state: State) => state.inactiveTriggerProps),
  popupProps: createSelector((state: State) => state.popupProps),
};

export class PopoverStore<Payload = undefined> extends ReactStore<State, Context, Selectors> {
  constructor(initialState?: Partial<State>) {
    super(
      { ...createInitialState<Payload>(), ...initialState },
      {
        popupRef: React.createRef<HTMLElement>(),
        backdropRef: React.createRef<HTMLDivElement>(),
        internalBackdropRef: React.createRef<HTMLDivElement>(),
        onOpenChange: undefined,
        onOpenChangeComplete: undefined,
        triggerFocusTargetRef: React.createRef<HTMLElement>(),
        beforeContentFocusGuardRef: React.createRef<HTMLElement>(),
      },
      selectors,
    );
  }

  registerTrigger(triggerId: string, triggerElement: HTMLElement, getPayload?: () => Payload) {
    const triggers = new Map(this.state.triggers);
    triggers.set(triggerId, { element: triggerElement, getPayload });
    this.set('triggers', triggers);
  }

  unregisterTrigger(triggerId: string) {
    const triggers = new Map(this.state.triggers);
    triggers.delete(triggerId);
    this.set('triggers', triggers);
  }

  setOpen(
    open: boolean,
    eventDetails: Omit<PopoverRoot.ChangeEventDetails, 'preventUnmountOnClose'>,
  ) {
    this.state.floatingRootContext.events.emit('setOpen', { open, eventDetails });
  }
}

export function createPopoverHandle<Payload = undefined>(): PopoverStore<Payload> {
  return new PopoverStore<Payload>();
}

type Selectors = typeof selectors;
