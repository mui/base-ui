import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ReactStore } from '@base-ui/utils/store';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { createEventEmitter } from './createEventEmitter';
import { dispatchOpenChange } from './floating-root/dispatchOpenChange';
import type { PopupEvents, PopupInteractionContext, ReferenceType } from './types';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { PopupTriggerMap } from './popupTriggerMap';
import type { HTMLProps } from '../../internals/types';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';

/**
 * State common to all popup stores.
 */
export type PopupStoreState<Payload> = {
  /**
   * Whether the popup is open (internal state).
   * When `openProp` is set, this holds the last open-change request since the prop last closed
   * the popup instead (see `useOpenStateTransitions`).
   */
  open: boolean;
  /**
   * Whether the popup is open (external prop).
   */
  readonly openProp: boolean | undefined;
  /**
   * Whether the popup should be mounted in the DOM.
   * This usually follows `open` but can be different during exit transitions.
   */
  mounted: boolean;
  /**
   * The current enter/exit transition status of the popup.
   */
  transitionStatus: TransitionStatus;
  /**
   * The popup's id unless its element sets one.
   */
  defaultPopupId: string | undefined;
  /**
   * Number of trigger elements currently registered for this popup.
   */
  triggerCount: number;
  /**
   * Whether to prevent unmounting the popup when closed.
   * Useful for interacting with JS animation libraries that control unmounting themselves.
   */
  preventUnmountingOnClose: boolean;

  /**
   * Optional payload set by the trigger.
   */
  payload: Payload | undefined;

  /**
   * ID of the currently active trigger.
   */
  activeTriggerId: string | null;
  /**
   * The currently active trigger DOM element.
   */
  activeTriggerElement: Element | null;
  /**
   * The last trigger element the popup was anchored to. Unlike `activeTriggerElement`, it is kept
   * once the popup unmounts, so the interaction hooks still recognize the trigger that the popup
   * last belonged to.
   */
  anchorElement: Element | null;
  /**
   * Whether the popup is open because of a request that deliberately carried no trigger, such as a
   * handle's `open(null)` or `openWithPayload()`. While set, a lone registered trigger is not
   * implicitly associated with the popup, so its trigger-owned state (such as `payload`) is not
   * forwarded. Reset by the Root once the popup is effectively closed.
   */
  openedWithoutTrigger: boolean;
  /**
   * The reason for the last accepted open change.
   */
  openChangeReason: string | null;
  /**
   * ID of the trigger (external prop).
   */
  readonly triggerIdProp: string | null | undefined;
  /**
   * The popup DOM element.
   */
  popupElement: HTMLElement | null;
  /**
   * The positioner DOM element.
   */
  positionerElement: HTMLElement | null;
  /**
   * A virtual anchor that overrides the active trigger, such as the cursor position of a tooltip
   * that follows it.
   */
  anchorOverride: ReferenceType | null;

  /**
   * Props to spread onto the active trigger element.
   */
  activeTriggerProps: HTMLProps;
  /**
   * Props to spread onto inactive trigger elements.
   */
  inactiveTriggerProps: HTMLProps;
  /**
   * Props to spread onto the popup element.
   */
  popupProps: HTMLProps;
};

export function createInitialPopupStoreState<Payload>(
  defaultPopupId?: string | undefined,
): PopupStoreState<Payload> {
  return {
    open: false,
    openProp: undefined,
    mounted: false,
    transitionStatus: undefined,
    defaultPopupId,
    triggerCount: 0,
    preventUnmountingOnClose: false,
    payload: undefined,
    activeTriggerId: null,
    activeTriggerElement: null,
    anchorElement: null,
    openedWithoutTrigger: false,
    openChangeReason: null,
    triggerIdProp: undefined,
    popupElement: null,
    positionerElement: null,
    anchorOverride: null,
    activeTriggerProps: EMPTY_OBJECT as HTMLProps,
    inactiveTriggerProps: EMPTY_OBJECT as HTMLProps,
    popupProps: EMPTY_OBJECT as HTMLProps,
  };
}

export type PopupStoreContext<ChangeEventDetails> = PopupInteractionContext & {
  /**
   * Map of registered trigger elements.
   */
  readonly triggerElements: PopupTriggerMap;
  /**
   * Reference to the popup element.
   */
  readonly popupRef: React.RefObject<HTMLElement | null>;
  /**
   * Callback fired when the open state changes.
   */
  onOpenChange?: ((open: boolean, eventDetails: ChangeEventDetails) => void) | undefined;
  /**
   * Callback fired when the open state change animation completes.
   */
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
  /**
   * Internal events for the interaction hooks, such as `openchange`.
   */
  readonly events: PopupEvents;
  /**
   * Whether the popup has a parent in the floating tree.
   */
  nested: boolean;
};

/**
 * Creates the context every popup store starts with, including what the interaction hooks share.
 */
export function createPopupStoreContext() {
  return {
    popupRef: React.createRef<HTMLElement>(),
    triggerElements: new PopupTriggerMap(),
    onOpenChange: undefined,
    onOpenChangeComplete: undefined,
    events: createEventEmitter(),
    nested: false,
  };
}

type S = PopupStoreState<unknown>;

const activeTriggerIdSelector = (state: S) => state.triggerIdProp ?? state.activeTriggerId;

const openSelector = (state: S) => state.openProp ?? state.open;

const activeTriggerElementSelector = (state: S) =>
  state.mounted ? state.activeTriggerElement : null;

const popupIdSelector = (state: S) => {
  const popupId = state.popupElement?.id ?? state.defaultPopupId;
  return popupId || undefined;
};

function triggerOwnsOpenPopup(state: S, triggerId: string | undefined) {
  return (
    triggerId !== undefined && openSelector(state) && activeTriggerIdSelector(state) === triggerId
  );
}

function triggerOwnsOpenPopupOrIsOnlyTrigger(state: S, triggerId: string | undefined) {
  if (triggerOwnsOpenPopup(state, triggerId)) {
    return true;
  }

  return (
    triggerId !== undefined &&
    openSelector(state) &&
    activeTriggerIdSelector(state) == null &&
    !state.openedWithoutTrigger &&
    state.triggerCount === 1
  );
}

export const popupStoreSelectors = {
  open: openSelector,
  mounted: (state: S) => state.mounted,
  // `open` is written synchronously on an open change; `mounted`/`transitionStatus` sync in a
  // layout effect. Match useTransitionStatus so a retained popup does not miss its starting phase.
  transitionStatus: (state: S) =>
    openSelector(state) && !state.mounted ? 'starting' : state.transitionStatus,
  triggerCount: (state: S) => state.triggerCount,
  preventUnmountingOnClose: (state: S) => state.preventUnmountingOnClose,
  payload: (state: S) => state.payload,

  activeTriggerId: activeTriggerIdSelector,
  activeTriggerElement: activeTriggerElementSelector,
  popupId: popupIdSelector,
  /**
   * Whether the trigger with the given ID was used to open the popup.
   */
  isTriggerActive: (state: S, triggerId: string | undefined) =>
    triggerId !== undefined && activeTriggerIdSelector(state) === triggerId,
  /**
   * Whether the popup is open and was activated by a trigger with the given ID.
   */
  isOpenedByTrigger: (state: S, triggerId: string | undefined) =>
    triggerOwnsOpenPopup(state, triggerId),
  /**
   * Whether the popup is mounted and was activated by a trigger with the given ID.
   */
  isMountedByTrigger: (state: S, triggerId: string | undefined) =>
    triggerId !== undefined && activeTriggerIdSelector(state) === triggerId && state.mounted,
  triggerProps: (state: S, isActive: boolean) =>
    isActive ? state.activeTriggerProps : state.inactiveTriggerProps,
  /**
   * Popup id for the trigger that currently owns the open popup.
   */
  triggerPopupId: (state: S, triggerId: string | undefined) =>
    triggerOwnsOpenPopupOrIsOnlyTrigger(state, triggerId) ? popupIdSelector(state) : undefined,
  popupProps: (state: S) => state.popupProps,

  popupElement: (state: S) => state.popupElement,
  // A `keepMounted` positioner is reported while the popup is closed, but not while an opening
  // popup is still hidden: the interaction hooks would otherwise try to focus or measure it before
  // it shows.
  positionerElement: (state: S) =>
    openSelector(state) && !state.mounted ? null : state.positionerElement,

  // Reads of the interaction hooks' store (`PopupInteractionStore`).
  defaultPopupId: (state: S) => state.defaultPopupId,
  anchorElement: (state: S) => state.anchorElement,
  anchor: (state: S) => state.anchorOverride ?? activeTriggerElementSelector(state),
};

/**
 * Applies what follows from a change of the trigger the popup is anchored to: the trigger is
 * remembered as the anchor element, and an anchor override that followed the old trigger follows
 * the new one.
 */
function syncAnchorState<State extends S>(previous: State, next: State): State {
  const previousAnchor = activeTriggerElementSelector(previous);
  const nextAnchor = activeTriggerElementSelector(next);

  if (previousAnchor === nextAnchor) {
    return next;
  }

  const followsAnchor =
    next.anchorOverride === previous.anchorOverride && previous.anchorOverride === previousAnchor;

  return {
    ...next,
    anchorElement: nextAnchor ?? next.anchorElement,
    anchorOverride: followsAnchor ? nextAnchor : next.anchorOverride,
  };
}

export type PopupStoreSelectors = typeof popupStoreSelectors;

type PopupOpenState = Pick<
  PopupStoreState<unknown>,
  | 'open'
  | 'preventUnmountingOnClose'
  | 'activeTriggerId'
  | 'activeTriggerElement'
  | 'openedWithoutTrigger'
>;

export function createPopupOpenState(
  state: S,
  open: boolean,
  trigger: Element | undefined,
  preventUnmountOnClose: boolean,
): PopupOpenState {
  // A request to stay mounted lasts until the popup opens again, so a later close can't drop it.
  const preventUnmountingOnClose =
    !open && (state.preventUnmountingOnClose || preventUnmountOnClose);

  const triggerId = trigger?.id ?? null;
  // A controlled `triggerId` can move the popup to another trigger without updating the stored id,
  // so the kept id is the one the popup currently resolves.
  let activeTriggerId = activeTriggerIdSelector(state);
  let activeTriggerElement = state.activeTriggerElement;

  // A close keeps the active trigger when it names no trigger or names the active one, so exit
  // animations play and focus returns to it. The active id can differ from the element's own `id`
  // once the Root matches the element to its registered trigger id.
  if (open || (triggerId && trigger !== state.activeTriggerElement)) {
    activeTriggerId = triggerId;
    activeTriggerElement = trigger ?? null;
  }

  return {
    open,
    preventUnmountingOnClose,
    activeTriggerId,
    activeTriggerElement,
    // An open request without a trigger (a handle's `open(null)` or `openWithPayload()`) must not
    // be reassociated with a lone registered trigger later on. Controlled and default opens never
    // pass through here, so they keep claiming a lone trigger. A close request keeps the flag: a
    // controlled root may decline it and stay open, so the Root clears the flag only once the
    // popup is effectively closed.
    openedWithoutTrigger: open ? trigger == null : state.openedWithoutTrigger,
  };
}

/**
 * The change event details a popup passes to `onOpenChange`.
 */
export type PopupOpenChangeEventDetails = BaseUIChangeEventDetails<string> & {
  preventUnmountOnClose(): void;
};

/**
 * State a popup store commits along with an accepted open change, on top of the open state that
 * every popup commits.
 */
export type PopupOpenChangeState<State extends PopupStoreState<unknown>> = Partial<
  Omit<State, keyof PopupOpenState | 'openChangeReason'>
>;

/**
 * State a popup store resets once its popup unmounts, on top of the fields every popup resets.
 */
export type PopupUnmountState<State extends PopupStoreState<unknown>> = Partial<
  Omit<State, PopupUnmountKey>
>;

type PopupUnmountKey =
  'activeTriggerId' | 'activeTriggerElement' | 'mounted' | 'preventUnmountingOnClose';

/**
 * The store of a popup Root. It holds the state every popup shares and runs every open change in
 * the same order:
 *
 * 1. A close request while the popup is closed is dropped, and `isOpenChangeIgnored` can drop any
 *    other change, before `onOpenChange` hears about it. A dropped close still cancels a pending
 *    hover open.
 * 2. `getCloseTrigger` can name the trigger a close request without one reports.
 * 3. `preventUnmountOnClose()` is added to the event details.
 * 4. `onOpenChange` is called and can cancel the change.
 * 5. A cancelled change goes no further.
 * 6. The interactions are notified.
 * 7. `prepareOpenChange` runs the store's own side effects and returns its extra state.
 * 8. One update commits the change, synchronously when `isCommittedSynchronously` says so. By
 *    default only hover changes are, and a store can turn that off, as Menu does.
 *
 * `onOpenChange` only hears about changes that can happen. A change the store would not commit
 * belongs in step 1, so it is dropped before it is reported. A controlled popup's last request
 * counts as its state until the `open` prop changes, so a close after an open the parent declined
 * without `cancel()` is still reported. A store can drop more in step 1 through
 * `isOpenChangeIgnored`, as Menu and Combobox do.
 *
 * Once the popup has finished closing and unmounts, `resetOnUnmount` clears what the open session
 * left behind, along with the store's own fields from `prepareUnmount`.
 *
 * Each popup store overrides only the steps where it differs.
 */
export abstract class BasePopupStore<
  State extends PopupStoreState<unknown>,
  Context extends PopupStoreContext<ChangeEventDetails>,
  Selectors extends Record<string, (state: Readonly<State>, ...args: any[]) => any>,
  ChangeEventDetails extends PopupOpenChangeEventDetails,
> extends ReactStore<Readonly<State>, Context, Selectors> {
  // Replaced on every open, so a close can tell whether the popup has opened again since.
  private openSession = {};

  override setState(newState: Readonly<State>): void {
    // A request or an `open` prop that opens the popup starts a new open session. An open request
    // a controlled `open` prop hasn't applied doesn't, so a close waiting on the parent keeps its
    // request.
    if (!openSelector(this.state) && openSelector(newState)) {
      this.openSession = {};
    }
    super.setState(
      this.anchorsToActiveTrigger() ? syncAnchorState(this.state, newState) : newState,
    );
  }

  /**
   * Whether the popup anchors to the trigger that opened it. A store that keeps its anchor in
   * `anchorElement` itself turns this off.
   */
  protected anchorsToActiveTrigger(): boolean {
    return true;
  }

  /**
   * Clears the anchor element and the anchor override. The trigger and positioner elements come
   * from the popup's own state, so they stay.
   */
  clearPositioning() {
    this.update({ anchorElement: null, anchorOverride: null });
  }

  setOpen = (
    nextOpen: boolean,
    eventDetails: Omit<ChangeEventDetails, 'preventUnmountOnClose'>,
  ): void => {
    const details = eventDetails as ChangeEventDetails;

    // A controlled popup can hold a request the `open` prop hasn't caught up with yet, so a close
    // is dropped only when both are closed. A hover open may still be pending, so the hover
    // interaction hears about the dropped close to cancel it.
    if (!nextOpen && !this.state.open && !this.state.openProp) {
      this.context.events.emit('droppedclose');
      return;
    }

    if (this.isOpenChangeIgnored(nextOpen, details)) {
      return;
    }

    if (!nextOpen && details.trigger == null) {
      const closeTrigger = this.getCloseTrigger();
      // A trigger that has left the document, such as one whose unmount closes the popup, isn't
      // reported.
      details.trigger = closeTrigger?.isConnected ? closeTrigger : undefined;
    }

    let preventUnmountOnClose = false;
    // The open session this close committed in. Unset until the close commits, and never set for
    // an open or a canceled close.
    let closeSession: object | undefined;
    details.preventUnmountOnClose = () => {
      preventUnmountOnClose = true;
      // A call made once the close is committed, such as after an `await` in `onOpenChange`, still
      // applies until the popup opens again, even if more closes commit in the meantime. A
      // controlled `open` prop may not have caught up with the close yet.
      if (closeSession === this.openSession) {
        this.set('preventUnmountingOnClose', true);
      }
    };

    this.context.onOpenChange?.(nextOpen, details);

    if (details.isCanceled) {
      return;
    }

    dispatchOpenChange(this.context, popupStoreSelectors.open(this.state), nextOpen, details);

    const extraState = this.prepareOpenChange(nextOpen, details);

    const commit = () => {
      this.update({
        ...extraState,
        ...createPopupOpenState(this.state, nextOpen, details.trigger, preventUnmountOnClose),
        openChangeReason: details.reason,
      } as Pick<State, keyof State>);
    };

    if (!nextOpen) {
      closeSession = this.openSession;
    }

    if (this.isCommittedSynchronously(details)) {
      ReactDOM.flushSync(commit);
    } else {
      commit();
    }
  };

  /**
   * Returns whether to drop an open change before `onOpenChange` hears about it.
   */
  protected isOpenChangeIgnored(_nextOpen: boolean, _eventDetails: ChangeEventDetails): boolean {
    return false;
  }

  /**
   * Returns the trigger to report for a close request that carries none: the trigger the popup is
   * open from.
   */
  protected getCloseTrigger(): Element | null | undefined {
    const activeTriggerId = activeTriggerIdSelector(this.state);
    if (activeTriggerId == null) {
      return undefined;
    }

    return (
      this.context.triggerElements.getById(activeTriggerId) ??
      activeTriggerElementSelector(this.state)
    );
  }

  /**
   * Runs the store's own side effects for an accepted open change and returns the state to commit
   * with it.
   */
  protected prepareOpenChange(
    _nextOpen: boolean,
    _eventDetails: ChangeEventDetails,
  ): PopupOpenChangeState<State> {
    return {};
  }

  /**
   * Returns whether to commit an open change synchronously. Hover changes are, so
   * `node.getAnimations()` sees the new state.
   */
  protected isCommittedSynchronously(eventDetails: ChangeEventDetails): boolean {
    return eventDetails.reason === REASONS.triggerHover;
  }

  /**
   * Clears what the open session left behind once the popup has finished closing and unmounted.
   */
  resetOnUnmount(): void {
    // A trigger press during the exit writes the pressed trigger and `open: true` to the store, but
    // a controlled `open` prop may not have committed yet (React 18 can run the exit completion in
    // between). `state.open` is reset when the prop closes the popup (see
    // `useOpenStateTransitions`), so `true` here means a request made since then: keep its trigger
    // instead of clearing it.
    const unmountState: Partial<Pick<PopupStoreState<unknown>, PopupUnmountKey>> = {
      mounted: false,
      preventUnmountingOnClose: false,
    };
    if (!this.state.open) {
      unmountState.activeTriggerId = null;
      unmountState.activeTriggerElement = null;
    }
    this.update({ ...this.prepareUnmount(), ...unmountState } as Pick<State, keyof State>);
  }

  /**
   * Runs the store's own cleanup once the popup has unmounted and returns the state to reset with
   * it.
   */
  protected prepareUnmount(): PopupUnmountState<State> {
    return {};
  }
}

/**
 * The `instantType` of a popup that opens on hover, such as a tooltip or a preview card. Opening on
 * focus and closing with the trigger or Escape skip the transition, and a hover change plays it.
 */
export function getHoverPopupInstantType(
  nextOpen: boolean,
  reason: string,
): { instantType?: 'dismiss' | 'focus' | undefined } {
  if (nextOpen && reason === REASONS.triggerFocus) {
    return { instantType: 'focus' };
  }
  if (!nextOpen && (reason === REASONS.triggerPress || reason === REASONS.escapeKey)) {
    return { instantType: 'dismiss' };
  }
  if (reason === REASONS.triggerHover) {
    return { instantType: undefined };
  }
  return {};
}

/**
 * Store members a detached handle-backed trigger reads or invokes for trigger registration and data
 * forwarding. `set`/`update` are included only for trigger-count and trigger-data bookkeeping; on a
 * detached (inert) store they are intentionally no-ops, so a write through them is not guaranteed to
 * be durable. Component handle-store views Pick these from their concrete store (preserving its
 * context and selectors) and add any component-specific trigger-invoked members such as `setOpen`.
 */
export type PopupTriggerStoreKeys = 'context' | 'select' | 'set' | 'state' | 'update' | 'useState';

/**
 * The subset of a popup store that trigger registration and data forwarding rely on. Narrow enough
 * that an inert store can be passed while detached.
 */
export type PopupTriggerDataStore<State extends PopupStoreState<unknown>> = Pick<
  ReactStore<Readonly<State>, PopupStoreContext<never>, PopupStoreSelectors>,
  PopupTriggerStoreKeys
>;
