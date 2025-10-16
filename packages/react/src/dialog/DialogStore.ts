import * as React from 'react';
import { createSelector, ReactStore } from '@base-ui-components/utils/store';
import { EMPTY_OBJECT } from '@base-ui-components/utils/empty';
import { type InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { type DialogRoot } from './root/DialogRoot';
import { type TransitionStatus } from '../utils/useTransitionStatus';
import type { FloatingUIOpenChangeDetails, HTMLProps } from '../utils/types';
import { type FloatingRootContext } from '../floating-ui-react/types';
import { getEmptyContext } from '../floating-ui-react/hooks/useFloatingRootContext';
import { PopupTriggerMap } from '../utils/popupStoreUtils';
import { createChangeEventDetails } from '../utils/createBaseUIEventDetails';

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

export class DialogHandle<Payload> {
  public readonly store: DialogStore<Payload>;

  constructor() {
    this.store = new DialogStore<Payload>();
  }

  /**
   * Opens the dialog and associates it with the trigger with the given id.
   * The trigger, if provided, must be a Dialog.Trigger component with this handle passed as a prop.
   *
   * @param triggerId ID of the trigger to associate with the dialog. If null, the dialog will open without a trigger association.
   */
  open(triggerId: string | null) {
    const triggerElement = triggerId
      ? (this.store.state.triggers.get(triggerId) ?? undefined)
      : undefined;

    if (process.env.NODE_ENV !== 'production' && triggerId && !triggerElement) {
      console.warn(
        `Base UI: DialogHandle.open: No trigger found with id "${triggerId}". The dialog will open, but the trigger will not be associated with the dialog.`,
      );
    }

    this.store.setOpen(
      true,
      createChangeEventDetails('imperative-action', undefined, triggerElement),
    );
  }

  /**
   * Opens the dialog and sets the payload.
   * Does not associate the dialog with any trigger.
   *
   * @param payload Payload to set when opening the dialog.
   */
  openWithPayload(payload: Payload) {
    this.store.set('payload', payload);
    this.store.setOpen(true, createChangeEventDetails('imperative-action', undefined, undefined));
  }

  /**
   * Closes the dialog.
   */
  close() {
    this.store.setOpen(false, createChangeEventDetails('imperative-action', undefined, undefined));
  }
}

export function createDialogHandle<Payload>(): DialogHandle<Payload> {
  return new DialogHandle<Payload>();
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
