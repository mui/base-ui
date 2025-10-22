import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createSelector, ReactStore } from '@base-ui-components/utils/store';
import { EMPTY_OBJECT } from '@base-ui-components/utils/empty';
import { FloatingRootContext } from '../../floating-ui-react';
import { getEmptyContext } from '../../floating-ui-react/hooks/useFloatingRootContext';
import { TransitionStatus } from '../../utils/useTransitionStatus';
import type { HTMLProps } from '../../utils/types';
import { type TooltipRoot } from '../root/TooltipRoot';

export type State = {
  open: boolean;
  delay: number | undefined;
  closeDelay: number | undefined;
  mounted: boolean;
  instantType: 'delay' | 'dismiss' | 'focus' | undefined;
  floatingRootContext: FloatingRootContext;
  trackCursorAxis: 'none' | 'x' | 'y' | 'both';
  transitionStatus: TransitionStatus;
  hoverable: boolean;
  lastOpenChangeReason: TooltipRoot.ChangeEventReason | null;

  triggerProps: HTMLProps;
  popupProps: HTMLProps;

  triggerElement: HTMLElement | null;
  positionerElement: HTMLElement | null;
};

export type Context = {
  popupRef: React.RefObject<HTMLElement | null>;
  onOpenChange?: (open: boolean, eventDetails: TooltipRoot.ChangeEventDetails) => void;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
};

const selectors = {
  open: createSelector((state: State) => state.open),
  delay: createSelector((state: State) => state.delay),
  closeDelay: createSelector((state: State) => state.closeDelay),
  mounted: createSelector((state: State) => state.mounted),
  instantType: createSelector((state: State) => state.instantType),
  floatingRootContext: createSelector((state: State) => state.floatingRootContext),
  trackCursorAxis: createSelector((state: State) => state.trackCursorAxis),
  transitionStatus: createSelector((state: State) => state.transitionStatus),
  hoverable: createSelector((state: State) => state.hoverable),
  lastOpenChangeReason: createSelector((state: State) => state.lastOpenChangeReason),
  triggerProps: createSelector((state: State) => state.triggerProps),
  popupProps: createSelector((state: State) => state.popupProps),
  triggerElement: createSelector((state: State) => state.triggerElement),
  positionerElement: createSelector((state: State) => state.positionerElement),
};

export class TooltipStore extends ReactStore<State, Context, typeof selectors> {
  constructor(initialState?: Partial<State>) {
    super(
      { ...createInitialState(), ...initialState },
      {
        popupRef: React.createRef<HTMLElement | null>(),
        onOpenChange: undefined,
        onOpenChangeComplete: undefined,
      },
      selectors,
    );
  }

  setOpen = (nextOpen: boolean, eventDetails: TooltipRoot.ChangeEventDetails) => {
    const reason = eventDetails.reason;

    const isHover = reason === 'trigger-hover';
    const isFocusOpen = nextOpen && reason === 'trigger-focus';
    const isDismissClose = !nextOpen && (reason === 'trigger-press' || reason === 'escape-key');

    this.context.onOpenChange?.(nextOpen, eventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    const changeState = () => {
      if (isFocusOpen || isDismissClose) {
        this.set('instantType', isFocusOpen ? 'focus' : 'dismiss');
      } else if (reason === 'trigger-hover') {
        this.set('instantType', undefined);
      }

      this.update({ open: nextOpen, lastOpenChangeReason: reason });
    };

    if (isHover) {
      // If a hover reason is provided, we need to flush the state synchronously. This ensures
      // `node.getAnimations()` knows about the new state.
      ReactDOM.flushSync(changeState);
    } else {
      changeState();
    }
  };
}

function createInitialState(): State {
  return {
    open: false,
    delay: undefined,
    closeDelay: undefined,
    mounted: false,
    instantType: undefined,
    floatingRootContext: getEmptyContext(),
    trackCursorAxis: 'none',
    transitionStatus: 'idle',
    hoverable: true,
    lastOpenChangeReason: null,
    triggerProps: EMPTY_OBJECT as HTMLProps,
    popupProps: EMPTY_OBJECT as HTMLProps,
    triggerElement: null,
    positionerElement: null,
  };
}
