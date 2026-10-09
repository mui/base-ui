import * as React from 'react';
import { NOOP } from '@base-ui/utils/empty';
import type {
  InlineRectCoords,
  PopupStoreContext,
  PopupStoreState,
  PopupTriggerStoreKeys,
} from '../../utils/popups';
import {
  BasePopupStore,
  createFloatingRootContextValues,
  createInitialPopupStoreState,
  getHoverPopupInstantType,
  popupStoreSelectors,
  PopupTriggerMap,
  updateInlineRectCoords,
} from '../../utils/popups';
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
 * currently exposes. Narrowed to the trigger-data members a trigger uses; it exposes no popup-open
 * mutator, so the inert fallback can be a plain `NullStore`.
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

  protected prepareOpenChange(nextOpen: boolean, eventDetails: PreviewCardRoot.ChangeEventDetails) {
    const { inlineRectCoordsRef } = this.context;

    // Capture the hovered inline-rect coordinates so the card anchors to the
    // exact point on the link that was hovered.
    const event = eventDetails.event;
    if (
      nextOpen &&
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
    instantType: undefined,
    adaptiveOrigin: undefined,
    closeDelay: CLOSE_DELAY,
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
    inlineRectCoordsRef: { current: undefined },
    ...createFloatingRootContextValues(nested),
  };
}
