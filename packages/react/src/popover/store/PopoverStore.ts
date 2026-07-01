'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ReactStore, createSelector } from '@base-ui/utils/store';
import { Timeout } from '@base-ui/utils/useTimeout';
import { type InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { type PopoverRoot } from '../root/PopoverRoot';
import { REASONS } from '../../internals/reasons';
import { NullStore } from '../../utils/NullStore';
import {
  attachPreventUnmountOnClose,
  createPopupFloatingRootContext,
  createInitialPopupStoreState,
  PopupStoreContext,
  popupStoreSelectors,
  PopupStoreState,
  PopupTriggerMap,
  setPopupOpenState,
} from '../../utils/popups';
import { PATIENT_CLICK_THRESHOLD } from '../../internals/constants';

export type State<Payload> = PopupStoreState<Payload> & {
  disabled: boolean;
  instantType: 'dismiss' | 'click' | 'focus' | 'trigger-change' | undefined;
  modal: boolean | 'trap-focus';
  focusManagerModal: boolean;
  openMethod: InteractionType | null;
  openChangeReason: PopoverRoot.ChangeEventReason | null;
  stickIfOpen: boolean;
  nested: boolean;
  titleElementId: string | undefined;
  descriptionElementId: string | undefined;
  openOnHover: boolean;
  closeDelay: number;
  hasViewport: boolean;
};

type Context = PopupStoreContext<PopoverRoot.ChangeEventDetails> & {
  readonly popupRef: React.RefObject<HTMLElement | null>;
  readonly backdropRef: React.RefObject<HTMLDivElement | null>;
  readonly internalBackdropRef: React.RefObject<HTMLDivElement | null>;
  readonly triggerFocusTargetRef: React.RefObject<HTMLElement | null>;
  readonly beforeContentFocusGuardRef: React.RefObject<HTMLElement | null>;
  readonly stickIfOpenTimeout: Timeout;
};

const selectors = {
  ...popupStoreSelectors,
  disabled: createSelector((state: State<unknown>) => state.disabled),
  instantType: createSelector((state: State<unknown>) => state.instantType),
  openMethod: createSelector((state: State<unknown>) => state.openMethod),
  openChangeReason: createSelector((state: State<unknown>) => state.openChangeReason),
  modal: createSelector((state: State<unknown>) => state.modal),
  focusManagerModal: createSelector((state: State<unknown>) => state.focusManagerModal),
  stickIfOpen: createSelector((state: State<unknown>) => state.stickIfOpen),
  titleElementId: createSelector((state: State<unknown>) => state.titleElementId),
  descriptionElementId: createSelector((state: State<unknown>) => state.descriptionElementId),
  openOnHover: createSelector((state: State<unknown>) => state.openOnHover),
  closeDelay: createSelector((state: State<unknown>) => state.closeDelay),
  hasViewport: createSelector((state: State<unknown>) => state.hasViewport),
};

type Selectors = typeof selectors;

/**
 * The store view that detached handle-backed triggers read from. Both the real `PopoverStore` and
 * the inert fallback store satisfy it, so a trigger can read from whichever store the handle
 * currently exposes. It is the base `ReactStore` (with the popover state, context, and selectors)
 * plus `setOpen`, which lives on the concrete stores rather than the base; on the detached fallback
 * store every mutation — including `setOpen` — is a no-op.
 */
export type PopoverHandleStore<Payload> = ReactStore<Readonly<State<Payload>>, Context, Selectors> &
  Pick<PopoverStore<Payload>, 'setOpen'>;

export class PopoverStore<Payload> extends ReactStore<
  Readonly<State<Payload>>,
  Context,
  Selectors
> {
  constructor(
    initialState?: Partial<State<Payload>>,
    floatingId?: string | undefined,
    nested = false,
  ) {
    const triggerElements = new PopupTriggerMap();
    super(
      createInitialState<Payload>(initialState, triggerElements, floatingId, nested),
      createInitialContext(triggerElements),
      selectors,
    );
  }

  setOpen = (
    nextOpen: boolean,
    eventDetails: Omit<PopoverRoot.ChangeEventDetails, 'preventUnmountOnClose'>,
  ) => {
    const isHover = eventDetails.reason === REASONS.triggerHover;
    const isKeyboardClick =
      eventDetails.reason === REASONS.triggerPress &&
      (eventDetails.event as MouseEvent).detail === 0;
    const isDismissClose =
      !nextOpen && (eventDetails.reason === REASONS.escapeKey || eventDetails.reason == null);

    const shouldPreventUnmountOnClose = attachPreventUnmountOnClose(
      eventDetails as PopoverRoot.ChangeEventDetails,
    );

    const activeTriggerId = this.select('activeTriggerId');

    if (
      !nextOpen &&
      eventDetails.reason === REASONS.closePress &&
      eventDetails.trigger == null &&
      activeTriggerId != null
    ) {
      eventDetails.trigger =
        this.context.triggerElements.getById(activeTriggerId) ??
        this.select('activeTriggerElement') ??
        undefined;
    }

    this.context.onOpenChange?.(nextOpen, eventDetails as PopoverRoot.ChangeEventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    this.state.floatingRootContext.dispatchOpenChange(nextOpen, eventDetails);

    const changeState = () => {
      const updatedState: Partial<State<Payload>> = {
        open: nextOpen,
        openChangeReason: eventDetails.reason,
      };

      setPopupOpenState(
        updatedState,
        nextOpen,
        eventDetails.trigger,
        shouldPreventUnmountOnClose(),
      );

      this.update(updatedState);
    };

    if (isHover) {
      // Only allow "patient" clicks to close the popover if it's open.
      // If they clicked within 500ms of the popover opening, keep it open.
      this.set('stickIfOpen', true);
      this.context.stickIfOpenTimeout.start(PATIENT_CLICK_THRESHOLD, () => {
        this.set('stickIfOpen', false);
      });

      ReactDOM.flushSync(changeState);
    } else {
      changeState();
    }

    if (isKeyboardClick || isDismissClose) {
      this.set('instantType', isKeyboardClick ? 'click' : 'dismiss');
    } else if (eventDetails.reason === REASONS.focusOut) {
      this.set('instantType', 'focus');
    } else {
      this.set('instantType', undefined);
    }
  };
}

/**
 * Inert fallback store used by detached handle-backed triggers while no `Popover.Root` is attached.
 * Its `setOpen` is a no-op (matching the inert reads/writes of `NullStore`), so a trigger can hand
 * it to focus-guard helpers that expect `setOpen` without it ever taking effect while detached.
 */
class NullPopoverStore<Payload> extends NullStore<Readonly<State<Payload>>, Context, Selectors> {
  setOpen() {}
}

/**
 * Creates the inert fallback store used by detached handle-backed triggers while no
 * `Popover.Root` is attached. It preserves a popover-specific trigger registry in context so
 * detached triggers can register before migrating to the live root store.
 */
export function createNullPopoverStore<Payload>(): PopoverHandleStore<Payload> {
  const triggerElements = new PopupTriggerMap();

  return new NullPopoverStore<Payload>(
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
    disabled: false,
    modal: false,
    focusManagerModal: false,
    instantType: undefined,
    openMethod: null,
    openChangeReason: null,
    titleElementId: undefined,
    descriptionElementId: undefined,
    stickIfOpen: true,
    nested: false,
    openOnHover: false,
    closeDelay: 0,
    hasViewport: false,
    ...initialState,
  };

  if (state.open && initialState?.mounted === undefined) {
    state.mounted = true;
  }

  state.floatingRootContext = createPopupFloatingRootContext(triggerElements, floatingId, nested);

  return state;
}

function createInitialContext(triggerElements: PopupTriggerMap): Context {
  return {
    popupRef: React.createRef<HTMLElement>(),
    backdropRef: React.createRef<HTMLDivElement>(),
    internalBackdropRef: React.createRef<HTMLDivElement>(),
    onOpenChange: undefined,
    onOpenChangeComplete: undefined,
    triggerFocusTargetRef: React.createRef<HTMLElement>(),
    beforeContentFocusGuardRef: React.createRef<HTMLElement>(),
    stickIfOpenTimeout: new Timeout(),
    triggerElements,
  };
}
