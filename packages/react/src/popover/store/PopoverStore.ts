'use client';
import * as React from 'react';
import { Timeout } from '@base-ui/utils/useTimeout';
import { NOOP } from '@base-ui/utils/empty';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { PopoverRoot } from '../root/PopoverRoot';
import { REASONS } from '../../internals/reasons';
import { NullStore } from '../../utils/NullStore';
import type { PopupStoreContext, PopupStoreState, PopupTriggerStoreKeys } from '../../utils/popups';
import {
  BasePopupStore,
  createFloatingRootContextValues,
  createInitialPopupStoreState,
  popupStoreSelectors,
  PopupTriggerMap,
} from '../../utils/popups';
import { PATIENT_CLICK_THRESHOLD } from '../../internals/constants';
import type { AdaptiveOriginMiddleware } from '../../utils/adaptiveOriginConstants';

export type State<Payload> = PopupStoreState<Payload> & {
  disabled: boolean;
  instantType: 'dismiss' | 'click' | 'focus' | 'trigger-change' | undefined;
  modal: boolean | 'trap-focus';
  focusManagerModal: boolean;
  openMethod: InteractionType | null;
  openChangeReason: PopoverRoot.ChangeEventReason | null;
  titleElementId: string | undefined;
  descriptionElementId: string | undefined;
  openOnHover: boolean;
  closeDelay: number;
  adaptiveOrigin: AdaptiveOriginMiddleware | undefined;
};

type Context = PopupStoreContext<PopoverRoot.ChangeEventDetails> & {
  readonly popupRef: React.RefObject<HTMLElement | null>;
  readonly triggerFocusTargetRef: React.RefObject<HTMLElement | null>;
  readonly beforeTriggerFocusGuardRef: React.RefObject<HTMLElement | null>;
  readonly beforeContentFocusGuardRef: React.RefObject<HTMLElement | null>;
  readonly stickIfOpenTimeout: Timeout;
  // Only read when a trigger is pressed, so it isn't reactive state.
  stickIfOpen: boolean;
};

const selectors = {
  ...popupStoreSelectors,
  disabled: (state: State<unknown>) => state.disabled,
  // `trigger-change` describes a popup moving between triggers, which only has
  // meaning while it is open. Dropping it once closed keeps a late or stale
  // restoration from marking a closing popup instant and skipping its exit
  // transition, including on close paths that never reach `setOpen` — a
  // controlled consumer committing `open={false}` goes straight through the prop.
  instantType: (state: State<unknown>) =>
    state.instantType === 'trigger-change' && !popupStoreSelectors.open(state)
      ? undefined
      : state.instantType,
  openMethod: (state: State<unknown>) => state.openMethod,
  openChangeReason: (state: State<unknown>) => state.openChangeReason,
  isPressOpenedByTrigger: (state: State<unknown>, triggerId: string | undefined) =>
    state.openChangeReason === REASONS.triggerPress &&
    popupStoreSelectors.isOpenedByTrigger(state, triggerId),
  // The trigger selectors below resolve to a constant for triggers that don't use them, so state
  // changes don't re-render every inactive trigger.
  isTouchPressOpen: (state: State<unknown>, openOnHover: boolean) =>
    openOnHover && state.openMethod === 'touch' && state.openChangeReason === REASONS.triggerPress,
  hasTriggerFocusGuards: (state: State<unknown>, triggerId: string | undefined) =>
    popupStoreSelectors.isOpenedByTrigger(state, triggerId) && !state.focusManagerModal,
  modal: (state: State<unknown>) => state.modal,
  titleElementId: (state: State<unknown>) => state.titleElementId,
  descriptionElementId: (state: State<unknown>) => state.descriptionElementId,
  openOnHover: (state: State<unknown>) => state.openOnHover,
  closeDelay: (state: State<unknown>) => state.closeDelay,
  adaptiveOrigin: (state: State<unknown>): AdaptiveOriginMiddleware | undefined =>
    state.adaptiveOrigin,
};

type Selectors = typeof selectors;

/**
 * The store view that detached handle-backed triggers read from. Both the real `PopoverStore` and
 * the inert fallback store satisfy it, so a trigger can read from whichever store the handle
 * currently exposes. Narrowed to the members a trigger actually uses — the trigger-data members plus
 * `setOpen` (called by the focus guards) — so the exposed surface can't bypass the open-change
 * pipeline; on the detached fallback store every one of these mutations is a no-op.
 */
export type PopoverHandleStore<Payload> = Pick<
  PopoverStore<Payload>,
  PopupTriggerStoreKeys | 'setOpen'
>;

export class PopoverStore<Payload> extends BasePopupStore<
  State<Payload>,
  Context,
  Selectors,
  PopoverRoot.ChangeEventDetails
> {
  constructor(
    initialState: Partial<State<Payload>>,
    floatingId: string | undefined,
    nested: boolean,
  ) {
    const triggerElements = new PopupTriggerMap();
    super(
      createInitialState<Payload>(initialState, floatingId),
      createInitialContext(triggerElements, nested),
      selectors,
    );
  }

  protected getCloseTrigger(eventDetails: PopoverRoot.ChangeEventDetails) {
    // Only a close button reports the trigger the popover is closing from.
    const activeTriggerId = this.select('activeTriggerId');
    if (eventDetails.reason !== REASONS.closePress || activeTriggerId == null) {
      return undefined;
    }

    return (
      this.context.triggerElements.getById(activeTriggerId) ??
      this.select('activeTriggerElement') ??
      undefined
    );
  }

  protected prepareOpenChange(_nextOpen: boolean, eventDetails: PopoverRoot.ChangeEventDetails) {
    if (eventDetails.reason === REASONS.triggerHover) {
      // Only allow "patient" clicks to close the popover if it's open.
      // If they clicked within 500ms of the popover opening, keep it open.
      this.context.stickIfOpen = true;
      this.context.stickIfOpenTimeout.start(PATIENT_CLICK_THRESHOLD, () => {
        this.context.stickIfOpen = false;
      });
    }

    return {};
  }

  // `instantType` is committed in its own update, after the open change.
  protected completeOpenChange(nextOpen: boolean, eventDetails: PopoverRoot.ChangeEventDetails) {
    const reason = eventDetails.reason;

    let instantType: State<Payload>['instantType'];
    if (reason === REASONS.triggerPress && (eventDetails.event as MouseEvent).detail === 0) {
      instantType = 'click';
    } else if (!nextOpen && (reason === REASONS.escapeKey || reason == null)) {
      instantType = 'dismiss';
    } else if (reason === REASONS.focusOut) {
      instantType = 'focus';
    }

    this.set('instantType', instantType);
  }

  protected prepareUnmount() {
    this.context.stickIfOpen = true;
    return { openChangeReason: null };
  }
}

/**
 * Creates the inert fallback store used by detached handle-backed triggers while no
 * `Popover.Root` is attached. It preserves a popover-specific trigger registry in context so
 * detached triggers can register before migrating to the live root store. `setOpen` is a no-op
 * (matching the inert reads/writes of `NullStore`), so a trigger can hand the store to focus-guard
 * helpers that expect `setOpen` without it ever taking effect while detached.
 */
export function createNullPopoverStore<Payload>(): PopoverHandleStore<Payload> {
  const triggerElements = new PopupTriggerMap();

  const store = new NullStore<Readonly<State<Payload>>, Context, Selectors>(
    Object.freeze(createInitialState<Payload>(undefined)),
    Object.freeze(createInitialContext(triggerElements)),
    selectors,
  );
  return Object.assign(store, { setOpen: NOOP });
}

function createInitialState<Payload>(
  initialState: Partial<State<Payload>> | undefined,
  floatingId?: string | undefined,
): State<Payload> {
  const state: State<Payload> = {
    ...createInitialPopupStoreState<Payload>(floatingId),
    disabled: false,
    modal: false,
    focusManagerModal: false,
    instantType: undefined,
    openMethod: null,
    openChangeReason: null,
    titleElementId: undefined,
    descriptionElementId: undefined,
    openOnHover: false,
    closeDelay: 0,
    adaptiveOrigin: undefined,
    ...initialState,
  };

  if (state.open && initialState?.mounted === undefined) {
    state.mounted = true;
  }

  return state;
}

function createInitialContext(triggerElements: PopupTriggerMap, nested = false): Context {
  return {
    popupRef: React.createRef<HTMLElement>(),
    onOpenChange: undefined,
    onOpenChangeComplete: undefined,
    triggerFocusTargetRef: React.createRef<HTMLElement>(),
    beforeTriggerFocusGuardRef: React.createRef<HTMLElement>(),
    beforeContentFocusGuardRef: React.createRef<HTMLElement>(),
    stickIfOpenTimeout: new Timeout(),
    stickIfOpen: true,
    triggerElements,
    ...createFloatingRootContextValues(nested),
  };
}
