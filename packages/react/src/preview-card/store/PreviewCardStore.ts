import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import {
  applyPopupOpenChange,
  createPopupFloatingRootContext,
  createInitialPopupStoreState,
  InlineRectCoords,
  PopupStoreContext,
  popupStoreSelectors,
  PopupStoreState,
  PopupTriggerMap,
  type PopupTriggerStoreKeys,
  updateInlineRectCoords,
} from '../../utils/popups';
import { type PreviewCardRoot } from '../root/PreviewCardRoot';
import { REASONS } from '../../internals/reasons';
import { NullStore } from '../../utils/NullStore';
import { CLOSE_DELAY } from '../utils/constants';
import type { AdaptiveOriginMiddleware } from '../../utils/adaptiveOriginConstants';

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
  PopupTriggerStoreKeys
>;

export class PreviewCardStore<Payload> extends ReactStore<
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

  public setOpen = (
    nextOpen: boolean,
    eventDetails: Omit<PreviewCardRoot.ChangeEventDetails, 'preventUnmountOnClose'>,
  ) => {
    const { inlineRectCoordsRef } = this.context;

    applyPopupOpenChange<State<Payload>, PreviewCardRoot.ChangeEventDetails>(
      this,
      nextOpen,
      eventDetails as PreviewCardRoot.ChangeEventDetails,
      {
        onBeforeDispatch() {
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
        },
      },
    );
  };
}

/**
 * Creates the inert fallback store used by detached handle-backed triggers while no
 * `PreviewCard.Root` is attached. It preserves a preview-card-specific trigger registry in context
 * so detached triggers can register before migrating to the live root store.
 */
export function createNullPreviewCardStore<Payload>(): PreviewCardHandleStore<Payload> {
  const triggerElements = new PopupTriggerMap();

  return new NullStore<Readonly<State<Payload>>, Context, Selectors>(
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
    instantType: undefined,
    adaptiveOrigin: undefined,
    closeDelay: CLOSE_DELAY,
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
    inlineRectCoordsRef: { current: undefined },
  };
}
