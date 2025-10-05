import * as React from 'react';
import { createSelector, ReactStore } from '@base-ui-components/utils/store';
import { type InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { type DialogRoot } from './root/DialogRoot';
import { type TransitionStatus } from '../utils/useTransitionStatus';
import { FloatingUIOpenChangeDetails, type HTMLProps } from '../utils/types';
import { type FloatingRootContext } from '../floating-ui-react/types';

export type State = {
  /**
   * Whether the dialog is currently open.
   */
  open: boolean;

  /**
   * Whether the dialog enters a modal state when open.
   */
  modal: boolean | 'trap-focus';
  /**
   * Determines if the dialog is nested within a parent dialog.
   */
  nested: boolean;
  /**
   * Number of nested dialogs that are currently open.
   */
  nestedOpenDialogCount: number;
  /**
   * Determines whether the dialog should close on outside clicks.
   */
  dismissible: boolean;
  /**
   * Determines what triggered the dialog to open.
   */
  openMethod: InteractionType | null;
  /**
   * The id of the description element associated with the dialog.
   */
  descriptionElementId: string | undefined;
  /**
   * The id of the title element associated with the dialog.
   */
  titleElementId: string | undefined;
  /**
   * Determines if the dialog should be mounted.
   */
  mounted: boolean;
  /**
   * The transition status of the dialog.
   */
  transitionStatus: TransitionStatus;
  /**
   * Active Trigger element's props.
   */
  activeTriggerProps: HTMLProps;
  /**
   * Inactive Trigger element's props.
   */
  inactiveTriggerProps: HTMLProps;
  /**
   * Popup element's props.
   */
  popupProps: HTMLProps;
  /**
   * The Floating UI root context.
   */
  floatingRootContext: FloatingRootContext;
  /**
   * The Popup DOM element.
   */
  popupElement: HTMLElement | null;
  /**
   * The Trigger DOM element.
   */
  activeTriggerId: string | null;
  triggers: TriggerMap;
  payload: unknown | undefined;
};

type TriggerMap<Payload = unknown> = Map<
  string,
  { element: HTMLElement; getPayload?: (() => Payload) | undefined }
>;

type Context = {
  popupRef: React.RefObject<HTMLElement | null>;
  backdropRef: React.RefObject<HTMLDivElement | null>;
  internalBackdropRef: React.RefObject<HTMLDivElement | null>;

  openChange?: (open: boolean, eventDetails: DialogRoot.ChangeEventDetails) => void;
  openChangeComplete?: (open: boolean) => void;
  nestedDialogOpen?: (ownChildrenCount: number) => void;
  nestedDialogClose?: () => void;
};

const selectors = {
  open: createSelector((state: State) => state.open),
  modal: createSelector((state: State) => state.modal),
  nested: createSelector((state: State) => state.nested),
  nestedOpenDialogCount: createSelector((state: State) => state.nestedOpenDialogCount),
  dismissible: createSelector((state: State) => state.dismissible),
  openMethod: createSelector((state: State) => state.openMethod),
  descriptionElementId: createSelector((state: State) => state.descriptionElementId),
  titleElementId: createSelector((state: State) => state.titleElementId),
  mounted: createSelector((state: State) => state.mounted),
  transitionStatus: createSelector((state: State) => state.transitionStatus),
  popupProps: createSelector((state: State) => state.popupProps),
  floatingRootContext: createSelector((state: State) => state.floatingRootContext),
  activeTriggerId: createSelector((state: State) => state.activeTriggerId),
  activeTriggerElement: createSelector((state: State) =>
    state.mounted && state.activeTriggerId != null
      ? (state.triggers.get(state.activeTriggerId)?.element ?? null)
      : null,
  ),
  popupElement: createSelector((state: State) => state.popupElement),
  payload: createSelector((state: State) => state.payload),
  activeTriggerProps: createSelector((state: State) => state.activeTriggerProps),
  inactiveTriggerProps: createSelector((state: State) => state.inactiveTriggerProps),
};

export class DialogStore<Payload> extends ReactStore<State, Context, typeof selectors> {
  static create(initialState: State) {
    const context: Context = {
      popupRef: React.createRef<HTMLElement>(),
      backdropRef: React.createRef<HTMLDivElement>(),
      internalBackdropRef: React.createRef<HTMLDivElement>(),
    };

    return new DialogStore(initialState, context, selectors);
  }

  public setOpen = (nextOpen: boolean, eventDetails: DialogRoot.ChangeEventDetails) => {
    this.context.openChange?.(nextOpen, eventDetails);

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
  };
}

export function createDialogHandle<Payload = undefined>(): DialogStore<Payload> {
  return new DialogStore<Payload>();
}
