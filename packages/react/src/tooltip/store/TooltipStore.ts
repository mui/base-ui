import * as React from 'react';
import { NOOP } from '@base-ui/utils/empty';
import type { TooltipRoot } from '../root/TooltipRoot';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { NullStore } from '../../utils/popups/NullStore';
import type { AdaptiveOriginMiddleware } from '../../utils/popups/positioning/adaptiveOriginConstants';
import { dispatchOpenChange } from '../../utils/popups/floating-root/dispatchOpenChange';
import type { PopupStoreContext, PopupStoreState, PopupTriggerStoreKeys } from '../../utils/popups';
import {
  BasePopupStore,
  createFloatingRootContextValues,
  createInitialPopupStoreState,
  getHoverPopupInstantType,
  popupStoreSelectors,
  PopupTriggerMap,
} from '../../utils/popups';

export type State<Payload> = PopupStoreState<Payload> & {
  disabled: boolean;
  instantType: 'delay' | 'dismiss' | 'focus' | undefined;
  isInstantPhase: boolean;
  trackCursorAxis: 'none' | 'x' | 'y' | 'both';
  disableHoverablePopup: boolean;
  openChangeReason: TooltipRoot.ChangeEventReason | null;
  closeOnClick: boolean;
  closeDelay: number;
  adaptiveOrigin: AdaptiveOriginMiddleware | undefined;
};

export type Context = PopupStoreContext<TooltipRoot.ChangeEventDetails> & {
  readonly popupRef: React.RefObject<HTMLElement | null>;
};

const selectors = {
  ...popupStoreSelectors,
  disabled: (state: State<unknown>) => state.disabled,
  instantType: (state: State<unknown>) => state.instantType,
  isInstantPhase: (state: State<unknown>) => state.isInstantPhase,
  trackCursorAxis: (state: State<unknown>) => state.trackCursorAxis,
  disableHoverablePopup: (state: State<unknown>) => state.disableHoverablePopup,
  lastOpenChangeReason: (state: State<unknown>) => state.openChangeReason,
  closeOnClick: (state: State<unknown>) => state.closeOnClick,
  // Active and inactive trigger props are the same object, so a constant for triggers that discard
  // them keeps those triggers from re-rendering when the props change.
  appliedTriggerProps: (state: State<unknown>, apply: boolean) =>
    apply ? state.activeTriggerProps : undefined,
  closeDelay: (state: State<unknown>) => state.closeDelay,
  adaptiveOrigin: (state: State<unknown>): AdaptiveOriginMiddleware | undefined =>
    state.adaptiveOrigin,
};

type Selectors = typeof selectors;

/**
 * The store view that detached handle-backed triggers read from. Both the real `TooltipStore` and
 * the inert fallback store satisfy it, so a trigger can read from whichever store the handle
 * currently exposes. Narrowed to the members a trigger actually uses — the trigger-data members plus
 * `setOpen`/`cancelPendingOpen` (called directly by the trigger) and `useSyncedValue` — so the
 * exposed surface can't bypass the open-change pipeline; on the detached fallback store every one of
 * these mutations is a no-op.
 */
export type TooltipHandleStore<Payload> = Pick<
  TooltipStore<Payload>,
  PopupTriggerStoreKeys | 'setOpen' | 'cancelPendingOpen' | 'useSyncedValue'
>;

export class TooltipStore<Payload> extends BasePopupStore<
  State<Payload>,
  Context,
  Selectors,
  TooltipRoot.ChangeEventDetails
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

  protected prepareOpenChange(nextOpen: boolean, eventDetails: TooltipRoot.ChangeEventDetails) {
    return getHoverPopupInstantType(nextOpen, eventDetails.reason);
  }

  // Used by trigger clicks to clear a delayed hover open without reporting a public open-state change.
  cancelPendingOpen(event: MouseEvent | PointerEvent) {
    dispatchOpenChange(
      this.context,
      this.select('open'),
      false,
      createChangeEventDetails(REASONS.triggerPress, event),
    );
  }
}

/**
 * Creates the inert fallback store used by detached handle-backed triggers while no `Tooltip.Root`
 * is attached. It preserves a tooltip-specific trigger registry in context so detached triggers can
 * register before migrating to the live root store. `setOpen`/`cancelPendingOpen` are no-ops
 * (matching the inert reads/writes of `NullStore`), so a trigger can call them from hover/click
 * handlers while detached without any effect.
 */
export function createNullTooltipStore<Payload>(): TooltipHandleStore<Payload> {
  const triggerElements = new PopupTriggerMap();

  const store = new NullStore<Readonly<State<Payload>>, Context, Selectors>(
    Object.freeze(createInitialState<Payload>(undefined)),
    Object.freeze(createInitialContext(triggerElements)),
    selectors,
  );
  return Object.assign(store, { setOpen: NOOP, cancelPendingOpen: NOOP });
}

function createInitialState<Payload>(
  initialState: Partial<State<Payload>> | undefined,
  floatingId?: string | undefined,
): State<Payload> {
  const state: State<Payload> = {
    ...createInitialPopupStoreState<Payload>(floatingId),
    disabled: false,
    instantType: undefined,
    isInstantPhase: false,
    trackCursorAxis: 'none',
    disableHoverablePopup: false,
    openChangeReason: null,
    closeOnClick: true,
    closeDelay: 0,
    adaptiveOrigin: undefined,
    ...initialState,
  };

  return state;
}

function createInitialContext(triggerElements: PopupTriggerMap, nested = false): Context {
  return {
    popupRef: React.createRef<HTMLElement | null>(),
    onOpenChange: undefined,
    onOpenChangeComplete: undefined,
    triggerElements,
    ...createFloatingRootContextValues(nested),
  };
}
