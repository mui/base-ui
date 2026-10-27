import * as React from 'react';
import { NOOP } from '@base-ui/utils/empty';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { DialogRoot } from '../root/DialogRoot';
import { NullStore } from '../../utils/popups/NullStore';
import type {
  PopupStoreContext,
  PopupTriggerDataStore,
  PopupStoreState,
} from '../../utils/popups/store';
import {
  BasePopupStore,
  createInitialPopupStoreState,
  createPopupStoreContext,
  popupStoreSelectors,
} from '../../utils/popups/store';

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
};

const selectors = {
  ...popupStoreSelectors,
  modal: (state: State<unknown>) => state.modal,
  nested: (state: State<unknown>) => state.nested,
  nestedOpenDialogCount: (state: State<unknown>) => state.nestedOpenDialogCount,
  nestedOpenDrawerCount: (state: State<unknown>) => state.nestedOpenDrawerCount,
  disablePointerDismissal: (state: State<unknown>) => state.disablePointerDismissal,
  openMethod: (state: State<unknown>) => state.openMethod,
  openChangeReason: (state: State<unknown>) => state.openChangeReason,
  descriptionElementId: (state: State<unknown>) => state.descriptionElementId,
  titleElementId: (state: State<unknown>) => state.titleElementId,
  viewportElement: (state: State<unknown>) => state.viewportElement,
  role: (state: State<unknown>) => state.role,
  // Dialogs aren't anchored, so their popup acts as their positioner.
  positionerElement: (state: State<unknown>) => state.popupElement,
};

/**
 * The subset of `DialogStore` that detached handle-backed triggers rely on. Both the real
 * `DialogStore` and the inert fallback store satisfy it, so a trigger can read from whichever
 * store the handle currently exposes.
 */
export type DialogHandleStore<Payload> = PopupTriggerDataStore<State<Payload>> &
  Pick<DialogStore<Payload>, 'setOpen'>;

export class DialogStore<Payload> extends BasePopupStore<
  State<Payload>,
  Context,
  typeof selectors,
  DialogRoot.ChangeEventDetails
> {
  constructor(
    initialState: Partial<State<Payload>> | undefined,
    defaultPopupId: string | undefined,
  ) {
    const state = createInitialState<Payload>(initialState, defaultPopupId);

    super(state, createInitialContext(), selectors);
  }

  protected getCloseTrigger() {
    // When closing the dialog, pass the old trigger to the onOpenChange event
    // so it's not reset too early (potentially causing focus issues in controlled scenarios).
    return this.state.activeTriggerId != null
      ? (this.state.activeTriggerElement ?? undefined)
      : undefined;
  }

  // The request is recorded as soon as it's made, so `onOpenChange` can make it after an `await`.
  protected attachPreventUnmountOnClose(eventDetails: DialogRoot.ChangeEventDetails) {
    eventDetails.preventUnmountOnClose = () => {
      this.set('preventUnmountingOnClose', true);
    };
    return () => false;
  }
}

/**
 * Creates the inert fallback store used by detached handle-backed triggers while no
 * `Dialog.Root` is attached. It preserves a dialog-specific trigger registry in context so
 * detached triggers can register before migrating to the live root store.
 */
export function createNullDialogStore<Payload>(): DialogHandleStore<Payload> {
  const store = new NullStore<Readonly<State<Payload>>, Context, typeof selectors>(
    Object.freeze(createInitialState<Payload>(undefined)),
    Object.freeze(createInitialContext()),
    selectors,
  );
  return Object.assign(store, { setOpen: NOOP });
}

function createInitialState<Payload>(
  initialState: Partial<State<Payload>> | undefined,
  defaultPopupId?: string | undefined,
): State<Payload> {
  const state: State<Payload> = {
    ...createInitialPopupStoreState<Payload>(defaultPopupId),
    modal: true,
    disablePointerDismissal: false,
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

  return state;
}

function createInitialContext(): Context {
  return {
    ...createPopupStoreContext(),
    backdropRef: React.createRef<HTMLDivElement>(),
    internalBackdropRef: React.createRef<HTMLDivElement>(),
    outsidePressEnabledRef: { current: true },
  };
}
