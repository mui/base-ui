import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createSelector, ReactStore } from '@base-ui-components/utils/store';
import { EMPTY_OBJECT } from '@base-ui-components/utils/empty';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { FloatingRootContext } from '../../floating-ui-react';
import { getEmptyContext } from '../../floating-ui-react/hooks/useFloatingRootContext';
import { TransitionStatus } from '../../utils/useTransitionStatus';
import type { HTMLProps } from '../../utils/types';
import { type TooltipRoot } from '../root/TooltipRoot';
import { PopupTriggerMap } from '../../utils/popupStoreUtils';

export type State<Payload> = {
  readonly open: boolean;
  readonly mounted: boolean;
  readonly disabled: boolean;
  readonly instantType: 'delay' | 'dismiss' | 'focus' | undefined;
  readonly isInstantPhase: boolean;
  readonly floatingRootContext: FloatingRootContext;
  readonly trackCursorAxis: 'none' | 'x' | 'y' | 'both';
  readonly transitionStatus: TransitionStatus;
  readonly hoverable: boolean;
  readonly lastOpenChangeReason: TooltipRoot.ChangeEventReason | null;
  readonly triggers: PopupTriggerMap;
  readonly activeTriggerId: string | null;
  readonly activeTriggerProps: HTMLProps;
  readonly inactiveTriggerProps: HTMLProps;
  readonly payload: Payload | undefined;
  readonly popupProps: HTMLProps;
  readonly positionerElement: HTMLElement | null;
};

export type Context = {
  popupRef: React.RefObject<HTMLElement | null>;
  onOpenChange?: (open: boolean, eventDetails: TooltipRoot.ChangeEventDetails) => void;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
};

const selectors = {
  open: createSelector((state: State<unknown>) => state.open),
  mounted: createSelector((state: State<unknown>) => state.mounted),
  disabled: createSelector((state: State<unknown>) => state.disabled),
  instantType: createSelector((state: State<unknown>) => state.instantType),
  isInstantPhase: createSelector((state: State<unknown>) => state.isInstantPhase),
  floatingRootContext: createSelector((state: State<unknown>) => state.floatingRootContext),
  trackCursorAxis: createSelector((state: State<unknown>) => state.trackCursorAxis),
  transitionStatus: createSelector((state: State<unknown>) => state.transitionStatus),
  hoverable: createSelector((state: State<unknown>) => state.hoverable),
  lastOpenChangeReason: createSelector((state: State<unknown>) => state.lastOpenChangeReason),
  triggers: createSelector((state: State<unknown>) => state.triggers),
  activeTriggerId: createSelector((state: State<unknown>) => state.activeTriggerId),
  activeTriggerElement: createSelector((state: State<unknown>) =>
    state.mounted && state.activeTriggerId != null
      ? (state.triggers.get(state.activeTriggerId) ?? null)
      : null,
  ),
  activeTriggerProps: createSelector((state: State<unknown>) => state.activeTriggerProps),
  inactiveTriggerProps: createSelector((state: State<unknown>) => state.activeTriggerProps),
  payload: createSelector((state: State<unknown>) => state.payload),
  popupProps: createSelector((state: State<unknown>) => state.popupProps),
  positionerElement: createSelector((state: State<unknown>) => state.positionerElement),
};

export class TooltipStore<Payload> extends ReactStore<State<Payload>, Context, typeof selectors> {
  constructor(initialState?: Partial<State<Payload>>) {
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

  public setOpen = (nextOpen: boolean, eventDetails: TooltipRoot.ChangeEventDetails) => {
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
      const newTriggerId = eventDetails.trigger?.id ?? null;
      if (newTriggerId || nextOpen) {
        this.set('activeTriggerId', newTriggerId);
      }
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
    externalStore: TooltipStore<Payload> | undefined,
    initialState?: Partial<State<Payload>>,
  ) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useRefWithInit(() => {
      return externalStore ?? new TooltipStore<Payload>(initialState);
    }).current;
  }
}

function createInitialState<Payload>(): State<Payload> {
  return {
    open: false,
    mounted: false,
    disabled: false,
    instantType: undefined,
    isInstantPhase: true,
    floatingRootContext: getEmptyContext(),
    trackCursorAxis: 'none',
    transitionStatus: 'idle',
    hoverable: true,
    lastOpenChangeReason: null,
    triggers: new Map(),
    payload: undefined,
    activeTriggerId: null,
    activeTriggerProps: EMPTY_OBJECT as HTMLProps,
    inactiveTriggerProps: EMPTY_OBJECT as HTMLProps,
    popupProps: EMPTY_OBJECT as HTMLProps,
    positionerElement: null,
  };
}
