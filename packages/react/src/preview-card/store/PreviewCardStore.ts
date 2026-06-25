import type * as React from 'react';
import { NOOP } from '@base-ui/utils/empty';
import type {
  PopupStoreContext,
  PopupStoreState,
  PopupTriggerStoreKeys,
} from '../../utils/popups/store';
import { updateInlineRectCoords } from '../../utils/popups/inlineRect';
import type { InlineRectCoords } from '../../utils/popups/inlineRect';
import {
  BasePopupStore,
  createInitialPopupStoreState,
  createPopupStoreContext,
  getHoverPopupInstantType,
  popupStoreSelectors,
} from '../../utils/popups/store';
import type { PreviewCardRoot } from '../root/PreviewCardRoot';
import { REASONS } from '../../internals/reasons';
import { NullStore } from '../../utils/popups/NullStore';
import { CLOSE_DELAY } from '../utils/constants';
import type { AdaptiveOriginMiddleware } from '../../utils/popups/positioning/adaptiveOriginConstants';

export type State<Payload> = PopupStoreState<Payload> & {
  instantType: 'dismiss' | 'focus' | undefined;
  adaptiveOrigin: AdaptiveOriginMiddleware | undefined;
  closeDelay: number;
};

export type Context = PopupStoreContext<PreviewCardRoot.ChangeEventDetails> & {
  inlineRectCoordsRef: React.MutableRefObject<InlineRectCoords | undefined>;
};

const selectors = {
  ...popupStoreSelectors,
  instantType: (state: State<unknown>) => state.instantType,
  adaptiveOrigin: (state: State<unknown>): AdaptiveOriginMiddleware | undefined =>
    state.adaptiveOrigin,
  closeDelay: (state: State<unknown>) => state.closeDelay,
};

type Selectors = typeof selectors;

/**
 * The store view that detached handle-backed triggers read from. Both the real `PreviewCardStore`
 * and the inert fallback store satisfy it, so a trigger can read from whichever store the handle
 * currently exposes. Narrowed to the trigger-data members a trigger uses, plus `setOpen`, which
 * the inert fallback provides as a no-op.
 */
export type PreviewCardHandleStore<Payload> = Pick<
  PreviewCardStore<Payload>,
  PopupTriggerStoreKeys | 'setOpen'
>;

export class PreviewCardStore<Payload> extends BasePopupStore<
  State<Payload>,
  Context,
  Selectors,
  PreviewCardRoot.ChangeEventDetails
> {
  constructor(initialState: Partial<State<Payload>>, defaultPopupId: string | undefined) {
    super(
      createInitialState<Payload>(initialState, defaultPopupId),
      createInitialContext(),
      selectors,
    );
  }

  protected prepareOpenChange(nextOpen: boolean, eventDetails: PreviewCardRoot.ChangeEventDetails) {
    const { inlineRectCoordsRef } = this.context;

    const event = eventDetails.event;
    if (!nextOpen) {
      // Clear immediately so reopening before the close transition finishes
      // captures coordinates for the newly hovered line.
      inlineRectCoordsRef.current = undefined;
    } else if (
      eventDetails.reason === REASONS.triggerHover &&
      eventDetails.trigger &&
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

    return getHoverPopupInstantType(nextOpen, eventDetails.reason);
  }

  protected prepareUnmount() {
    this.context.inlineRectCoordsRef.current = undefined;
    return {};
  }
}

/**
 * Creates the inert fallback store used by detached handle-backed triggers while no
 * `PreviewCard.Root` is attached. It preserves a preview-card-specific trigger registry in context
 * so detached triggers can register before migrating to the live root store.
 */
export function createNullPreviewCardStore<Payload>(): PreviewCardHandleStore<Payload> {
  const store = new NullStore<Readonly<State<Payload>>, Context, Selectors>(
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
    instantType: undefined,
    adaptiveOrigin: undefined,
    closeDelay: CLOSE_DELAY,
    ...initialState,
  };

  return state;
}

function createInitialContext(): Context {
  return {
    ...createPopupStoreContext(),
    inlineRectCoordsRef: { current: undefined },
  };
}
