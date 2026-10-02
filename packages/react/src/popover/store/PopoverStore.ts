'use client';
import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import { Timeout } from '@base-ui/utils/useTimeout';
import { NOOP } from '@base-ui/utils/empty';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import type { PopoverRoot } from '../root/PopoverRoot';
import { REASONS } from '../../internals/reasons';
import { NullStore } from '../../utils/NullStore';
import type { PopupStoreContext, PopupStoreState, PopupTriggerStoreKeys } from '../../utils/popups';
import {
  createInitialPopupStoreState,
  popupStoreSelectors,
  PopupTriggerMap,
  createPopupOpenState,
  runOpenChange,
} from '../../utils/popups';
import { PATIENT_CLICK_THRESHOLD } from '../../internals/constants';
import type { AdaptiveOriginMiddleware } from '../../utils/adaptiveOriginConstants';

export type State<Payload> = PopupStoreState<Payload> & {
  disabled: boolean;
  instantType: 'dismiss' | 'click' | 'focus' | 'trigger-change' | undefined;
  modal: boolean | 'trap-focus';
  focusManagerModal: boolean;
  openMethod: InteractionType | null;
  stickIfOpen: boolean;
  titleElementId: string | undefined;
  descriptionElementId: string | undefined;
  openOnHover: boolean;
  closeDelay: number;
  adaptiveOrigin: AdaptiveOriginMiddleware | undefined;
};

type Context = PopupStoreContext<PopoverRoot.ChangeEventDetails> & {
  readonly popupRef: React.RefObject<HTMLElement | null>;
  readonly stickIfOpenTimeout: Timeout;
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
  modal: (state: State<unknown>) => state.modal,
  focusManagerModal: (state: State<unknown>) => state.focusManagerModal,
  stickIfOpen: (state: State<unknown>) => state.stickIfOpen,
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

export class PopoverStore<Payload> extends ReactStore<
  Readonly<State<Payload>>,
  Context,
  Selectors
> {
  constructor(
    initialState: Partial<State<Payload>>,
    floatingId: string | undefined,
    nested: boolean,
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
    const reason = eventDetails.reason;
    const activeTriggerId = this.select('activeTriggerId');

    runOpenChange(
      this.state.floatingRootContext,
      nextOpen,
      eventDetails as PopoverRoot.ChangeEventDetails,
      {
        open: this.select('open'),
        onOpenChange: this.context.onOpenChange,
        // Only a close button reports the trigger the popover closes from.
        trigger:
          reason === REASONS.closePress && activeTriggerId != null
            ? (this.context.triggerElements.getById(activeTriggerId) ??
              this.select('activeTriggerElement'))
            : undefined,
        flushHover: true,
        commit: (preventUnmountOnClose) => {
          if (reason === REASONS.triggerHover) {
            // Only allow "patient" clicks to close the popover if it's open.
            // If they clicked within 500ms of the popover opening, keep it open.
            this.set('stickIfOpen', true);
            this.context.stickIfOpenTimeout.start(PATIENT_CLICK_THRESHOLD, () => {
              this.set('stickIfOpen', false);
            });
          }

          let instantType: State<Payload>['instantType'];
          if (reason === REASONS.triggerPress && (eventDetails.event as MouseEvent).detail === 0) {
            instantType = 'click';
          } else if (!nextOpen && (reason === REASONS.escapeKey || reason == null)) {
            instantType = 'dismiss';
          } else if (reason === REASONS.focusOut) {
            instantType = 'focus';
          }

          this.update({
            ...createPopupOpenState(this.state, nextOpen, eventDetails, preventUnmountOnClose),
            instantType,
          });
        },
      },
    );
  };
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
    Object.freeze(createInitialState<Payload>(undefined, triggerElements)),
    Object.freeze(createInitialContext(triggerElements)),
    selectors,
  );
  return Object.assign(store, { setOpen: NOOP });
}

function createInitialState<Payload>(
  initialState: Partial<State<Payload>> | undefined,
  triggerElements: PopupTriggerMap,
  floatingId?: string | undefined,
  nested = false,
): State<Payload> {
  const state: State<Payload> = {
    ...createInitialPopupStoreState<Payload>(triggerElements, floatingId, nested),
    disabled: false,
    modal: false,
    focusManagerModal: false,
    instantType: undefined,
    openMethod: null,
    titleElementId: undefined,
    descriptionElementId: undefined,
    stickIfOpen: true,
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

function createInitialContext(triggerElements: PopupTriggerMap): Context {
  return {
    popupRef: React.createRef<HTMLElement>(),
    onOpenChange: undefined,
    onOpenChangeComplete: undefined,
    stickIfOpenTimeout: new Timeout(),
    triggerElements,
  };
}
