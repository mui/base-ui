import * as React from 'react';
import { createSelector, ReactStore } from '@base-ui-components/utils/store';
import { EMPTY_OBJECT } from '@base-ui-components/utils/empty';
import { type InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { type DialogRoot } from '../root/DialogRoot';
import { type TransitionStatus } from '../../utils/useTransitionStatus';
import type { FloatingUIOpenChangeDetails, HTMLProps } from '../../utils/types';
import { type FloatingRootContext } from '../../floating-ui-react/types';
import { getEmptyContext } from '../../floating-ui-react/hooks/useFloatingRootContext';
import { PopupTriggerMap } from '../../utils/popupStoreUtils';

export type State<Payload> = {
  open: boolean;
  mounted: boolean;
  modal: boolean | 'trap-focus';
  dismissible: boolean;
  transitionStatus: TransitionStatus;
  openMethod: InteractionType | null;
  nested: boolean;
  nestedOpenDialogCount: number;
  titleElementId: string | undefined;
  descriptionElementId: string | undefined;
  activeTriggerId: string | null;
  popupElement: HTMLElement | null;
  triggers: PopupTriggerMap;
  floatingRootContext: FloatingRootContext;
  payload: Payload | undefined;
  activeTriggerProps: HTMLProps;
  inactiveTriggerProps: HTMLProps;
  popupProps: HTMLProps;
};

type Context = {
  popupRef: React.RefObject<HTMLElement | null>;
  backdropRef: React.RefObject<HTMLDivElement | null>;
  internalBackdropRef: React.RefObject<HTMLDivElement | null>;
  preventUnmountingOnCloseRef: React.RefObject<boolean>;

  openChange?: (open: boolean, eventDetails: DialogRoot.ChangeEventDetails) => void;
  openChangeComplete?: (open: boolean) => void;
  nestedDialogOpen?: (ownChildrenCount: number) => void;
  nestedDialogClose?: () => void;
};

const selectors = {
  open: createSelector((state: State<unknown>) => state.open),
  modal: createSelector((state: State<unknown>) => state.modal),
  nested: createSelector((state: State<unknown>) => state.nested),
  nestedOpenDialogCount: createSelector((state: State<unknown>) => state.nestedOpenDialogCount),
  dismissible: createSelector((state: State<unknown>) => state.dismissible),
  openMethod: createSelector((state: State<unknown>) => state.openMethod),
  descriptionElementId: createSelector((state: State<unknown>) => state.descriptionElementId),
  titleElementId: createSelector((state: State<unknown>) => state.titleElementId),
  mounted: createSelector((state: State<unknown>) => state.mounted),
  transitionStatus: createSelector((state: State<unknown>) => state.transitionStatus),
  popupProps: createSelector((state: State<unknown>) => state.popupProps),
  floatingRootContext: createSelector((state: State<unknown>) => state.floatingRootContext),
  activeTriggerId: createSelector((state: State<unknown>) => state.activeTriggerId),
  activeTriggerElement: createSelector((state: State<unknown>) =>
    state.mounted && state.activeTriggerId != null
      ? (state.triggers.get(state.activeTriggerId) ?? null)
      : null,
  ),
  triggers: createSelector((state: State<unknown>) => state.triggers),
  popupElement: createSelector((state: State<unknown>) => state.popupElement),
  payload: createSelector((state: State<unknown>) => state.payload),
  activeTriggerProps: createSelector((state: State<unknown>) => state.activeTriggerProps),
  inactiveTriggerProps: createSelector((state: State<unknown>) => state.inactiveTriggerProps),
};

export class DialogStore<Payload> extends ReactStore<State<Payload>, Context, typeof selectors> {
  constructor(initialState?: Partial<State<Payload>>) {
    super(
      { ...createInitialState<Payload>(), ...initialState },
      {
        popupRef: React.createRef<HTMLElement>(),
        backdropRef: React.createRef<HTMLDivElement>(),
        internalBackdropRef: React.createRef<HTMLDivElement>(),
        preventUnmountingOnCloseRef: { current: false },
      },
      selectors,
    );
  }

  public setOpen = (
    nextOpen: boolean,
    eventDetails: Omit<DialogRoot.ChangeEventDetails, 'preventUnmountOnClose'>,
  ) => {
    (eventDetails as DialogRoot.ChangeEventDetails).preventUnmountOnClose = () => {
      this.context.preventUnmountingOnCloseRef.current = true;
    };

    this.context.openChange?.(nextOpen, eventDetails as DialogRoot.ChangeEventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    const details: FloatingUIOpenChangeDetails = {
      open: nextOpen,
      nativeEvent: eventDetails.event,
      reason: eventDetails.reason,
      nested: this.state.nested,
    };

    this.state.floatingRootContext.events?.emit('openchange', details);

    this.set('open', nextOpen);
    const newTriggerId = eventDetails.trigger?.id ?? null;
    if (newTriggerId || nextOpen) {
      this.set('activeTriggerId', newTriggerId);
    }
  };
}

function createInitialState<Payload>(): State<Payload> {
  return {
    open: false,
    dismissible: true,
    nested: false,
    popupElement: null,
    activeTriggerId: null,
    modal: true,
    descriptionElementId: undefined,
    titleElementId: undefined,
    openMethod: null,
    mounted: false,
    transitionStatus: 'idle',
    nestedOpenDialogCount: 0,
    triggers: new Map(),
    floatingRootContext: getEmptyContext(),
    payload: undefined,
    activeTriggerProps: EMPTY_OBJECT as HTMLProps,
    inactiveTriggerProps: EMPTY_OBJECT as HTMLProps,
    popupProps: EMPTY_OBJECT as HTMLProps,
  };
}
