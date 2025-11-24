import * as React from 'react';
import { createSelector, ReactStore } from '@base-ui-components/utils/store';
import { EMPTY_OBJECT } from '@base-ui-components/utils/empty';
import { type InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { type DialogRoot } from '../root/DialogRoot';
import { type TransitionStatus } from '../../utils/useTransitionStatus';
import type { FloatingUIOpenChangeDetails, HTMLProps } from '../../utils/types';
import { type FloatingRootContext } from '../../floating-ui-react/types';
import { getEmptyRootContext } from '../../floating-ui-react/utils/getEmptyRootContext';
import { PopupTriggerMap } from '../../utils/popupStoreUtils';

export type State<Payload> = {
  readonly open: boolean;
  readonly mounted: boolean;
  readonly modal: boolean | 'trap-focus';
  readonly disablePointerDismissal: boolean;
  readonly transitionStatus: TransitionStatus;
  readonly openMethod: InteractionType | null;
  readonly nested: boolean;
  readonly nestedOpenDialogCount: number;
  readonly titleElementId: string | undefined;
  readonly descriptionElementId: string | undefined;
  readonly activeTriggerId: string | null;
  readonly popupElement: HTMLElement | null;
  readonly viewportElement: HTMLElement | null;
  readonly triggers: PopupTriggerMap;
  readonly floatingRootContext: FloatingRootContext;
  readonly payload: Payload | undefined;
  readonly activeTriggerProps: HTMLProps;
  readonly inactiveTriggerProps: HTMLProps;
  readonly popupProps: HTMLProps;
  readonly role: 'dialog' | 'alertdialog';
};

type Context = {
  readonly popupRef: React.RefObject<HTMLElement | null>;
  readonly backdropRef: React.RefObject<HTMLDivElement | null>;
  readonly internalBackdropRef: React.RefObject<HTMLDivElement | null>;
  readonly preventUnmountingOnCloseRef: React.RefObject<boolean>;

  readonly onOpenChange?: (open: boolean, eventDetails: DialogRoot.ChangeEventDetails) => void;
  readonly onOpenChangeComplete?: (open: boolean) => void;
  readonly onNestedDialogOpen?: (ownChildrenCount: number) => void;
  readonly onNestedDialogClose?: () => void;
};

const selectors = {
  open: createSelector((state: State<unknown>) => state.open),
  modal: createSelector((state: State<unknown>) => state.modal),
  nested: createSelector((state: State<unknown>) => state.nested),
  nestedOpenDialogCount: createSelector((state: State<unknown>) => state.nestedOpenDialogCount),
  disablePointerDismissal: createSelector((state: State<unknown>) => state.disablePointerDismissal),
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
  viewportElement: createSelector((state: State<unknown>) => state.viewportElement),
  payload: createSelector((state: State<unknown>) => state.payload),
  activeTriggerProps: createSelector((state: State<unknown>) => state.activeTriggerProps),
  inactiveTriggerProps: createSelector((state: State<unknown>) => state.inactiveTriggerProps),
  role: createSelector((state: State<unknown>) => state.role),
};

export class DialogStore<Payload> extends ReactStore<State<Payload>, Context, typeof selectors> {
  constructor(initialState?: Partial<State<Payload>>) {
    super(
      createInitialState<Payload>(initialState),
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

    if (!nextOpen && eventDetails.trigger == null && this.state.activeTriggerId != null) {
      // When closing the dialog, pass the old trigger to the onOpenChange event
      // so it's not reset too early (potentially causing focus issues in controlled scenarios).
      eventDetails.trigger = this.state.triggers.get(this.state.activeTriggerId);
    }

    this.context.onOpenChange?.(nextOpen, eventDetails as DialogRoot.ChangeEventDetails);

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

function createInitialState<Payload>(initialState: Partial<State<Payload>> = {}): State<Payload> {
  return {
    disablePointerDismissal: false,
    modal: true,
    open: false,
    nested: false,
    popupElement: null,
    viewportElement: null,
    activeTriggerId: null,
    descriptionElementId: undefined,
    titleElementId: undefined,
    openMethod: null,
    mounted: false,
    transitionStatus: 'idle',
    nestedOpenDialogCount: 0,
    triggers: new Map(),
    floatingRootContext: getEmptyRootContext(),
    payload: undefined,
    activeTriggerProps: EMPTY_OBJECT as HTMLProps,
    inactiveTriggerProps: EMPTY_OBJECT as HTMLProps,
    popupProps: EMPTY_OBJECT as HTMLProps,
    role: 'dialog',
    ...initialState,
  };
}
