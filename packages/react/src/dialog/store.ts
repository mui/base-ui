import * as React from 'react';
import { ControllableStore, createSelector, useStore } from '@base-ui-components/utils/store';
import { EventEmitter } from '@base-ui-components/utils/EventEmitter';
import { type InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { type DialogRoot } from './root/DialogRoot';
import { type TransitionStatus } from '../utils/useTransitionStatus';
import { type HTMLProps } from '../utils/types';
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
   * Resolver for the Trigger element's props.
   */
  triggerProps: HTMLProps;
  /**
   * Resolver for the Popup element's props.
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
  triggerElement: HTMLElement | null;
};

export type DialogEventMap = {
  setOpen: [open: boolean, eventDetails: DialogRoot.ChangeEventDetails];
  openChange: [open: boolean, method: InteractionType | null];
  transitionStatusChange: [status: TransitionStatus];
  mountChange: [mounted: boolean];
  popupElementChange: [popupElement: HTMLElement | null];
  triggerElementChange: [triggerElement: HTMLElement | null];
  openChangeComplete: [open: boolean];
  nestedDialogOpen: [ownChildrenCount: number];
  nestedDialogClose: [];
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
  triggerProps: createSelector((state: State) => state.triggerProps),
  popupProps: createSelector((state: State) => state.popupProps),
  floatingRootContext: createSelector((state: State) => state.floatingRootContext),
  popupElement: createSelector((state: State) => state.popupElement),
  triggerElement: createSelector((state: State) => state.triggerElement),
} as const;

type Selectors = typeof selectors;

export class DialogStore extends ControllableStore<State> {
  static create(initialState: State) {
    return new DialogStore(initialState);
  }

  public elements = {
    popupRef: React.createRef<HTMLElement>(),
    backdropRef: React.createRef<HTMLDivElement>(),
    internalBackdropRef: React.createRef<HTMLDivElement>(),
  };

  public readonly events = new EventEmitter<DialogEventMap>();

  public useState<K extends keyof Selectors>(key: K): ReturnType<Selectors[K]> {
    // False positive
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useStore<State, ReturnType<Selectors[K]>>(
      this,
      selectors[key] as (state: State) => ReturnType<Selectors[K]>,
    );
  }
}
