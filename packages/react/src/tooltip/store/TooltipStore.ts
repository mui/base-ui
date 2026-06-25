import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import { NOOP } from '@base-ui/utils/empty';
import { type TooltipRoot } from '../root/TooltipRoot';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { NullStore } from '../../utils/NullStore';
import type { AdaptiveOriginMiddleware } from '../../utils/adaptiveOriginConstants';
import {
  applyPopupOpenChange,
  createPopupFloatingRootContext,
  createInitialPopupStoreState,
  type InlineRectCoords,
  type PopupStoreContext,
  type PopupStoreState,
  type PopupTriggerStoreKeys,
  popupStoreSelectors,
  PopupTriggerMap,
  updateInlineRectCoords
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
  readonly inlineRectCoordsRef: React.RefObject<InlineRectCoords | undefined>;
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

export class TooltipStore<Payload> extends ReactStore<
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
    eventDetails: Omit<TooltipRoot.ChangeEventDetails, 'preventUnmountOnClose'>,
  ) => {
    applyPopupOpenChange<State<Payload>, TooltipRoot.ChangeEventDetails>(
      this,
      nextOpen,
      eventDetails as TooltipRoot.ChangeEventDetails,
      {
        extraState: { openChangeReason: eventDetails.reason },
        onBeforeDispatch: () => {
          // Capture the hovered inline-rect coordinates so the tooltip anchors to the
          // exact line of a multiline trigger that was hovered.
          const { inlineRectCoordsRef } = this.context;
          const event = eventDetails.event;
          if (
            nextOpen &&
            eventDetails.reason === REASONS.triggerHover &&
            eventDetails.trigger &&
            event != null &&
            'clientX' in event &&
            'clientY' in event &&
            inlineRectCoordsRef.current?.element !== eventDetails.trigger
          ) {
            updateInlineRectCoords(
              inlineRectCoordsRef,
              eventDetails.trigger,
              event.clientX,
              event.clientY,
            );
          }
        },
      },
    );
  };

  // Used by trigger clicks to clear a delayed hover open without reporting a public open-state change.
  cancelPendingOpen(event: MouseEvent | PointerEvent) {
    this.state.floatingRootContext.dispatchOpenChange(
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
    Object.freeze(createInitialState<Payload>(undefined, triggerElements)),
    Object.freeze(createInitialContext(triggerElements)),
    selectors,
  );
  return Object.assign(store, { setOpen: NOOP, cancelPendingOpen: NOOP });
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

  state.floatingRootContext = createPopupFloatingRootContext(triggerElements, floatingId, nested);

  return state;
}

function createInitialContext(triggerElements: PopupTriggerMap): Context {
  return {
    popupRef: React.createRef<HTMLElement | null>(),
    onOpenChange: undefined,
    onOpenChangeComplete: undefined,
    triggerElements,
    inlineRectCoordsRef: { current: undefined }
  };
}
