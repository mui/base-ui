import * as React from 'react';
import { createSelector, ReactStore } from '@base-ui-components/utils/store';
import { type InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { type DialogRoot } from './root/DialogRoot';
import { type TransitionStatus } from '../utils/useTransitionStatus';
import type { FloatingUIOpenChangeDetails, PopupTriggerMap, HTMLProps } from '../utils/types';
import { type FloatingRootContext } from '../floating-ui-react/types';

export type State = {
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
  payload: unknown | undefined;
  activeTriggerProps: HTMLProps;
  inactiveTriggerProps: HTMLProps;
  popupProps: HTMLProps;
};

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

export class DialogStore extends ReactStore<State, Context, typeof selectors> {
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
