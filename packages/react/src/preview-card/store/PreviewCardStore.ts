'use client';
/* eslint-disable react-hooks/rules-of-hooks */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createSelector, ReactStore } from '@base-ui/utils/store';
import { useId } from '@base-ui/utils/useId';
import {
  createInitialPopupStoreStateBase,
  InlineRectCoords,
  PopupFloatingRootContext,
  PopupStoreContext,
  popupStoreSelectors,
  PopupStoreStateBase,
  PopupTriggerMap,
  setPopupOpenState,
  updateInlineRectCoords,
  usePopupFloatingRootContext,
} from '../../utils/popups';
import { type PreviewCardRoot } from '../root/PreviewCardRoot';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { CLOSE_DELAY } from '../utils/constants';
import { type FloatingRootContext, useFloatingParentNodeId } from '../../floating-ui-react';

export type State<Payload> = PopupStoreStateBase<Payload> & {
  instantType: 'dismiss' | 'focus' | undefined;
  hasViewport: boolean;
};

export type Context = PopupStoreContext<PreviewCardRoot.ChangeEventDetails> & {
  floatingRootContext: FloatingRootContext;
  closeDelayRef: React.RefObject<number>;
  inlineRectCoordsRef: React.MutableRefObject<InlineRectCoords | undefined>;
};

const selectors = {
  ...popupStoreSelectors,
  instantType: createSelector((state: State<unknown>) => state.instantType),
  hasViewport: createSelector((state: State<unknown>) => state.hasViewport),
};

export class PreviewCardStore<Payload> extends ReactStore<
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
    const state = { ...createInitialState<Payload>(), ...initialState };
    state.floatingId = floatingId;

    super(
      state,
      {
        floatingRootContext: undefined as never,
        popupRef: React.createRef<HTMLElement | null>(),
        onOpenChange: undefined,
        onOpenChangeComplete: undefined,
        triggerElements,
        closeDelayRef: { current: CLOSE_DELAY },
        inlineRectCoordsRef: { current: undefined },
      },
      selectors,
    );

    this.context.floatingRootContext = new PopupFloatingRootContext({
      popupStore: this as unknown as ReactStore<
        State<unknown>,
        PopupStoreContext<PreviewCardRoot.ChangeEventDetails>,
        typeof popupStoreSelectors
      >,
      nested,
      onOpenChange: this.setOpen as (
        open: boolean,
        eventDetails: BaseUIChangeEventDetails<string>,
      ) => void,
    }) as Context['floatingRootContext'];
  }

  public setOpen = (
    nextOpen: boolean,
    eventDetails: Omit<PreviewCardRoot.ChangeEventDetails, 'preventUnmountOnClose'>,
  ) => {
    const reason = eventDetails.reason;

    const isHover = reason === REASONS.triggerHover;
    const isFocusOpen = nextOpen && reason === REASONS.triggerFocus;
    const isDismissClose =
      !nextOpen && (reason === REASONS.triggerPress || reason === REASONS.escapeKey);

    (eventDetails as PreviewCardRoot.ChangeEventDetails).preventUnmountOnClose = () => {
      this.set('preventUnmountingOnClose', true);
    };

    this.context.onOpenChange?.(nextOpen, eventDetails as PreviewCardRoot.ChangeEventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    const event = eventDetails.event;
    if (
      nextOpen &&
      isHover &&
      eventDetails.trigger &&
      'clientX' in event &&
      'clientY' in event &&
      this.context.inlineRectCoordsRef.current?.element !== eventDetails.trigger
    ) {
      updateInlineRectCoords(
        this.context.inlineRectCoordsRef,
        eventDetails.trigger,
        event.clientX,
        event.clientY,
      );
    }

    this.context.floatingRootContext.dispatchOpenChange(nextOpen, eventDetails);

    const changeState = () => {
      const updatedState: Partial<State<Payload>> = { open: nextOpen };

      if (isFocusOpen) {
        updatedState.instantType = 'focus';
      } else if (isDismissClose) {
        updatedState.instantType = 'dismiss';
      } else if (reason === REASONS.triggerHover) {
        updatedState.instantType = undefined;
      }

      setPopupOpenState(updatedState, nextOpen, eventDetails.trigger);

      this.update(updatedState);
    };

    if (isHover) {
      // If a hover reason is provided, we need to flush the state synchronously. This ensures
      // `node.getAnimations()` knows about the new state.
      ReactDOM.flushSync(changeState);
    } else {
      changeState();
    }
  };

  public static useStore<Payload>(
    externalStore: PreviewCardStore<Payload> | undefined,
    initialState?: Partial<State<Payload>>,
  ) {
    const floatingId = useId();
    const nested = useFloatingParentNodeId() != null;

    const internalStoreRef = React.useRef<PreviewCardStore<Payload> | null>(null);
    if (externalStore === undefined && internalStoreRef.current === null) {
      internalStoreRef.current = new PreviewCardStore<Payload>(initialState, floatingId, nested);
    }

    const store = externalStore ?? internalStoreRef.current!;

    usePopupFloatingRootContext(store, { floatingId, nested });

    return store;
  }
}

function createInitialState<Payload>(): State<Payload> {
  return {
    ...createInitialPopupStoreStateBase<Payload>(),
    instantType: undefined,
    hasViewport: false,
  };
}
