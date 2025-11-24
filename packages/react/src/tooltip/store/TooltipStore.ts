import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createSelector, ReactStore } from '@base-ui-components/utils/store';
import { EMPTY_OBJECT } from '@base-ui-components/utils/empty';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { FloatingRootContext } from '../../floating-ui-react';
import { getEmptyRootContext } from '../../floating-ui-react/utils/getEmptyRootContext';
import { TransitionStatus } from '../../utils/useTransitionStatus';
import type { HTMLProps } from '../../utils/types';
import { type TooltipRoot } from '../root/TooltipRoot';
import { PopupTriggerMap } from '../../utils/popupStoreUtils';
import { REASONS } from '../../utils/reasons';

export type State<Payload> = {
  readonly open: boolean;
  readonly mounted: boolean;
  readonly disabled: boolean;
  readonly instantType: 'delay' | 'dismiss' | 'focus' | undefined;
  readonly isInstantPhase: boolean;
  readonly floatingRootContext: FloatingRootContext;
  readonly trackCursorAxis: 'none' | 'x' | 'y' | 'both';
  readonly transitionStatus: TransitionStatus;
  readonly disableHoverablePopup: boolean;
  readonly preventUnmountingOnClose: boolean;
  readonly lastOpenChangeReason: TooltipRoot.ChangeEventReason | null;
  readonly triggers: PopupTriggerMap;
  readonly activeTriggerId: string | null;
  readonly activeTriggerProps: HTMLProps;
  readonly inactiveTriggerProps: HTMLProps;
  readonly payload: Payload | undefined;
  readonly popupProps: HTMLProps;
  readonly popupElement: HTMLElement | null;
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
  disableHoverablePopup: createSelector((state: State<unknown>) => state.disableHoverablePopup),
  preventUnmountingOnClose: createSelector(
    (state: State<unknown>) => state.preventUnmountingOnClose,
  ),
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
  popupElement: createSelector((state: State<unknown>) => state.popupElement),
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

  public setOpen = (
    nextOpen: boolean,
    eventDetails: Omit<TooltipRoot.ChangeEventDetails, 'preventUnmountOnClose'>,
  ) => {
    const reason = eventDetails.reason;

    const isHover = reason === REASONS.triggerHover;
    const isFocusOpen = nextOpen && reason === REASONS.triggerFocus;
    const isDismissClose =
      !nextOpen && (reason === REASONS.triggerPress || reason === REASONS.escapeKey);

    (eventDetails as TooltipRoot.ChangeEventDetails).preventUnmountOnClose = () => {
      this.set('preventUnmountingOnClose', true);
    };

    this.context.onOpenChange?.(nextOpen, eventDetails as TooltipRoot.ChangeEventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    const changeState = () => {
      if (isFocusOpen) {
        this.set('instantType', 'focus');
      } else if (isDismissClose) {
        this.set('instantType', 'dismiss');
      } else if (reason === REASONS.triggerHover) {
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
    floatingRootContext: getEmptyRootContext(),
    trackCursorAxis: 'none',
    transitionStatus: 'idle',
    disableHoverablePopup: false,
    preventUnmountingOnClose: false,
    lastOpenChangeReason: null,
    triggers: new Map(),
    payload: undefined,
    activeTriggerId: null,
    activeTriggerProps: EMPTY_OBJECT as HTMLProps,
    inactiveTriggerProps: EMPTY_OBJECT as HTMLProps,
    popupProps: EMPTY_OBJECT as HTMLProps,
    popupElement: null,
    positionerElement: null,
  };
}
