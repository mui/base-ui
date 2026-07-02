import * as React from 'react';
import { createSelector, ReactStore } from '@base-ui/utils/store';
import { type InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { type DialogRoot } from '../root/DialogRoot';
import { NullStore } from '../../utils/NullStore';
import {
  createPopupFloatingRootContext,
  createInitialPopupStoreState,
  PopupStoreContext,
  popupStoreSelectors,
  PopupTriggerDataStore,
  PopupStoreState,
  PopupTriggerMap,
  setPopupOpenState,
} from '../../utils/popups';

export type State<Payload> = PopupStoreState<Payload> & {
  modal: boolean | 'trap-focus';
  disablePointerDismissal: boolean;
  openMethod: InteractionType | null;
  nested: boolean;
  nestedOpenDialogCount: number;
  nestedOpenDrawerCount: number;
  titleElementId: string | undefined;
  descriptionElementId: string | undefined;
  viewportElement: HTMLElement | null;
  role: 'dialog' | 'alertdialog';
};

type Context = PopupStoreContext<DialogRoot.ChangeEventDetails> & {
  readonly popupRef: React.RefObject<HTMLElement | null>;
  readonly backdropRef: React.RefObject<HTMLDivElement | null>;
  readonly internalBackdropRef: React.RefObject<HTMLDivElement | null>;
  readonly outsidePressEnabledRef: React.MutableRefObject<boolean>;
  readonly onNestedDialogOpen?: ((dialogCount: number, drawerCount: number) => void) | undefined;
  readonly onNestedDialogClose?: (() => void) | undefined;
};

const selectors = {
  ...popupStoreSelectors,
  modal: createSelector((state: State<unknown>) => state.modal),
  nested: createSelector((state: State<unknown>) => state.nested),
  nestedOpenDialogCount: createSelector((state: State<unknown>) => state.nestedOpenDialogCount),
  nestedOpenDrawerCount: createSelector((state: State<unknown>) => state.nestedOpenDrawerCount),
  disablePointerDismissal: createSelector((state: State<unknown>) => state.disablePointerDismissal),
  openMethod: createSelector((state: State<unknown>) => state.openMethod),
  descriptionElementId: createSelector((state: State<unknown>) => state.descriptionElementId),
  titleElementId: createSelector((state: State<unknown>) => state.titleElementId),
  viewportElement: createSelector((state: State<unknown>) => state.viewportElement),
  role: createSelector((state: State<unknown>) => state.role),
};

/**
 * The subset of `DialogStore` that detached handle-backed triggers rely on. Both the real
 * `DialogStore` and the inert fallback store satisfy it, so a trigger can read from whichever
 * store the handle currently exposes.
 */
export type DialogHandleStore<Payload> = PopupTriggerDataStore<State<Payload>>;

export class DialogStore<Payload> extends ReactStore<
  Readonly<State<Payload>>,
  Context,
  typeof selectors
> {
  constructor(
    initialState?: Partial<State<Payload>>,
    floatingId?: string | undefined,
    nested = false,
  ) {
    const triggerElements = new PopupTriggerMap();
    const state = createInitialState<Payload>(initialState, triggerElements, floatingId, nested);

    super(state, createInitialContext(triggerElements), selectors);
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

    this.state.floatingRootContext.dispatchOpenChange(nextOpen, eventDetails);

    const updatedState: Partial<State<Payload>> = {
      open: nextOpen,
    };

    setPopupOpenState(updatedState, nextOpen, eventDetails.trigger);

    this.update(updatedState);
  };
}

/**
 * Creates the inert fallback store used by detached handle-backed triggers while no
 * `Dialog.Root` is attached. It preserves a dialog-specific trigger registry in context so
 * detached triggers can register before migrating to the live root store.
 */
export function createNullDialogStore<Payload>(): DialogHandleStore<Payload> {
  const triggerElements = new PopupTriggerMap();

  return new NullStore<Readonly<State<Payload>>, Context, typeof selectors>(
    Object.freeze(createInitialState<Payload>(undefined, triggerElements)),
    Object.freeze(createInitialContext(triggerElements)),
    selectors,
  );
}

function createInitialState<Payload>(
  initialState: Partial<State<Payload>> | undefined,
  triggerElements: PopupTriggerMap,
  floatingId?: string | undefined,
  nested = false,
): State<Payload> {
  const state: State<Payload> = {
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
    nestedOpenDrawerCount: 0,
    role: 'dialog',
    ...initialState,
  };

  state.floatingRootContext = createPopupFloatingRootContext(triggerElements, floatingId, nested);

  return state;
}

function createInitialContext(triggerElements: PopupTriggerMap): Context {
  return {
    popupRef: React.createRef<HTMLElement>(),
    backdropRef: React.createRef<HTMLDivElement>(),
    internalBackdropRef: React.createRef<HTMLDivElement>(),
    outsidePressEnabledRef: { current: true },
    triggerElements,
    onOpenChange: undefined,
    onOpenChangeComplete: undefined,
  };
}
