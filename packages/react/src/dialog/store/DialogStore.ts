import * as React from 'react';
import { createSelector, ReactStore } from '@base-ui-components/utils/store';
import { type InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { type DialogRoot } from '../root/DialogRoot';
import type { FloatingUIOpenChangeDetails } from '../../utils/types';
import {
  createInitialPopupStoreState,
  PopupStoreContext,
  PopupStoreState,
  PopupTriggerMap,
} from '../../utils/popupStoreUtils';

export type State<Payload> = PopupStoreState<Payload> & {
  readonly modal: boolean | 'trap-focus';
  readonly disablePointerDismissal: boolean;
  readonly openMethod: InteractionType | null;
  readonly nested: boolean;
  readonly nestedOpenDialogCount: number;
  readonly titleElementId: string | undefined;
  readonly descriptionElementId: string | undefined;
  readonly viewportElement: HTMLElement | null;
  readonly role: 'dialog' | 'alertdialog';
};

type Context = PopupStoreContext<DialogRoot.ChangeEventDetails> & {
  readonly popupRef: React.RefObject<HTMLElement | null>;
  readonly backdropRef: React.RefObject<HTMLDivElement | null>;
  readonly internalBackdropRef: React.RefObject<HTMLDivElement | null>;
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
    state.mounted ? state.activeTriggerElement : null,
  ),
  popupElement: createSelector((state: State<unknown>) => state.popupElement),
  viewportElement: createSelector((state: State<unknown>) => state.viewportElement),
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
  role: createSelector((state: State<unknown>) => state.role),
  preventUnmountingOnClose: createSelector(
    (state: State<unknown>) => state.preventUnmountingOnClose,
  ),
};

export class DialogStore<Payload> extends ReactStore<State<Payload>, Context, typeof selectors> {
  constructor(initialState?: Partial<State<Payload>>) {
    super(
      createInitialState<Payload>(initialState),
      {
        popupRef: React.createRef<HTMLElement>(),
        backdropRef: React.createRef<HTMLDivElement>(),
        internalBackdropRef: React.createRef<HTMLDivElement>(),
        triggerElements: new PopupTriggerMap(),
        onOpenChange: undefined,
        onOpenChangeComplete: undefined,
      },
      selectors,
    );
  }

  public setOpen = (
    nextOpen: boolean,
    eventDetails: Omit<DialogRoot.ChangeEventDetails, 'preventUnmountOnClose'>,
  ) => {
    (eventDetails as DialogRoot.ChangeEventDetails).preventUnmountOnClose = () => {
      this.set('preventUnmountingOnClose', true);
    };

    if (!nextOpen && eventDetails.trigger == null && this.state.activeTriggerId != null) {
      // When closing the dialog, pass the old trigger to the onOpenChange event
      // so it's not reset too early (potentially causing focus issues in controlled scenarios).
      eventDetails.trigger = this.state.activeTriggerElement ?? undefined;
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

    this.state.floatingRootContext.context.events?.emit('openchange', details);

    this.set('open', nextOpen);
    const newTriggerId = eventDetails.trigger?.id ?? null;
    if (newTriggerId || nextOpen) {
      this.set('activeTriggerId', newTriggerId);
    }
  };
}

function createInitialState<Payload>(initialState: Partial<State<Payload>> = {}): State<Payload> {
  return {
    ...createInitialPopupStoreState<Payload>(),
    modal: true,
    disablePointerDismissal: false,
    popupElement: null,
    viewportElement: null,
    descriptionElementId: undefined,
    titleElementId: undefined,
    openMethod: null,
    nested: false,
    nestedOpenDialogCount: 0,
    role: 'dialog',
    ...initialState,
  };
}
