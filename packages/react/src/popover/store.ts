import * as React from 'react';
import { Store, createSelector } from '@base-ui-components/utils/store';
import { type InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { type FloatingRootContext } from '../floating-ui-react';
import { type TransitionStatus } from '../utils/useTransitionStatus';
import { type HTMLProps } from '../utils/types';
import { getEmptyContext } from '../floating-ui-react/hooks/useFloatingRootContext';
import { PopoverRoot } from './root/PopoverRoot';

const EMPTY_OBJ = {};

type TriggerMap<Payload = unknown> = Map<
  string,
  { element: HTMLElement; getPayload?: (() => Payload) | undefined }
>;

export type State = {
  modal: boolean | 'trap-focus';

  open: boolean;
  mounted: boolean;
  activeTriggerId: string | null;
  positionerElement: HTMLElement | null;
  popupElement: HTMLElement | null;
  triggers: TriggerMap;

  instantType: 'dismiss' | 'click' | undefined;
  transitionStatus: TransitionStatus;
  openMethod: InteractionType | null;
  openReason: PopoverRoot.ChangeEventReason | null;

  titleId: string | undefined;
  descriptionId: string | undefined;

  floatingRootContext: FloatingRootContext;

  payload: unknown | undefined;

  activeTriggerProps: HTMLProps;
  inactiveTriggerProps: HTMLProps;
  popupProps: HTMLProps;
  stickIfOpen: boolean;

  triggerFocusTargetRef: React.RefObject<HTMLSpanElement | null>;
  beforeContentFocusGuardRef: React.RefObject<HTMLSpanElement | null>;
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
    titleId: undefined,
    descriptionId: undefined,
    floatingRootContext: getEmptyContext(),
    payload: undefined,
    activeTriggerProps: EMPTY_OBJ as HTMLProps,
    inactiveTriggerProps: EMPTY_OBJ as HTMLProps,
    popupProps: EMPTY_OBJ as HTMLProps,
    stickIfOpen: true,
    triggerFocusTargetRef: React.createRef<HTMLSpanElement>(),
    beforeContentFocusGuardRef: React.createRef<HTMLSpanElement>(),
  };
}

export class PopoverStore<Payload = undefined> extends Store<State> {
  constructor(initialState?: Partial<State>) {
    super({ ...createInitialState<Payload>(), ...initialState });
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

export const selectors = {
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

  titleId: createSelector((state: State) => state.titleId),
  descriptionId: createSelector((state: State) => state.descriptionId),

  payload: createSelector((state: State) => state.payload),

  activeTriggerProps: createSelector((state: State) => state.activeTriggerProps),
  inactiveTriggerProps: createSelector((state: State) => state.inactiveTriggerProps),
  popupProps: createSelector((state: State) => state.popupProps),
};
