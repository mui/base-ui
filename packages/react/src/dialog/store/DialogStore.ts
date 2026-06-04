'use client';
/* eslint-disable react-hooks/rules-of-hooks */
import * as React from 'react';
import { createSelector, ReactStore } from '@base-ui/utils/store';
import { type InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { useId } from '@base-ui/utils/useId';
import { type DialogRoot } from '../root/DialogRoot';
import {
  createInitialPopupStoreStateBase,
  PopupFloatingRootContext,
  PopupStoreContext,
  popupStoreSelectors,
  PopupStoreStateBase,
  PopupTriggerMap,
  setPopupOpenState,
  usePopupFloatingRootContext,
} from '../../utils/popups';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { useFloatingParentNodeId } from '../../floating-ui-react';

export type State<Payload> = PopupStoreStateBase<Payload> & {
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
  floatingRootContext: PopupFloatingRootContext<State<unknown>, DialogRoot.ChangeEventDetails>;
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
    const state = createInitialState<Payload>(initialState);
    state.floatingId = floatingId;

    super(
      state,
      {
        floatingRootContext: undefined as never,
        popupRef: React.createRef<HTMLElement>(),
        backdropRef: React.createRef<HTMLDivElement>(),
        internalBackdropRef: React.createRef<HTMLDivElement>(),
        outsidePressEnabledRef: { current: true },
        triggerElements,
        onOpenChange: undefined,
        onOpenChangeComplete: undefined,
      },
      selectors,
    );

    this.context.floatingRootContext = new PopupFloatingRootContext({
      popupStore: this as unknown as ReactStore<
        State<unknown>,
        PopupStoreContext<DialogRoot.ChangeEventDetails>,
        typeof popupStoreSelectors
      >,
      nested,
      treatPopupAsFloatingElement: true,
      onOpenChange: this.setOpen as (
        open: boolean,
        eventDetails: BaseUIChangeEventDetails<string>,
      ) => void,
    }) as Context['floatingRootContext'];
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

    this.context.floatingRootContext.dispatchOpenChange(nextOpen, eventDetails);

    const updatedState: Partial<State<Payload>> = {
      open: nextOpen,
    };

    setPopupOpenState(updatedState, nextOpen, eventDetails.trigger);

    this.update(updatedState);
  };

  static useStore<Payload>(
    externalStore: DialogStore<Payload> | undefined,
    initialState?: Partial<State<Payload>>,
  ) {
    const floatingId = useId();
    const nested = useFloatingParentNodeId() != null;

    const internalStoreRef = React.useRef<DialogStore<Payload> | null>(null);
    if (externalStore === undefined && internalStoreRef.current === null) {
      internalStoreRef.current = new DialogStore<Payload>(initialState, floatingId, nested);
    }

    const store = externalStore ?? internalStoreRef.current!;

    usePopupFloatingRootContext(store, { floatingId, nested });

    return store;
  }
}

function createInitialState<Payload>(initialState: Partial<State<Payload>> = {}): State<Payload> {
  return {
    ...createInitialPopupStoreStateBase<Payload>(),
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
}
