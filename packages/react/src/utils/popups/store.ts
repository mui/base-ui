import * as ReactDOM from 'react-dom';
import { ReactStore } from '@base-ui/utils/store';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import type { FloatingRootContext } from './floating-root/types';
import { FloatingRootStore } from './floating-root/FloatingRootStore';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { PopupTriggerMap } from './popupTriggerMap';
import type { HTMLProps } from '../../internals/types';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { attachPreventUnmountOnClose } from './popupStoreUtils';

/**
 * State common to all popup stores.
 */
export type PopupStoreState<Payload> = {
  /**
   * Whether the popup is open (internal state).
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

  floatingRootContext: FloatingRootContext;
  floatingId: string | undefined;
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
  triggerElements: PopupTriggerMap,
  floatingId?: string | undefined,
  nested = false,
): PopupStoreState<Payload> {
  return {
    open: false,
    openProp: undefined,
    mounted: false,
    transitionStatus: undefined,
    floatingRootContext: new FloatingRootStore({
      open: false,
      transitionStatus: undefined,
      floatingElement: null,
      referenceElement: null,
      triggerElements,
      floatingId,
      syncOnly: true,
      nested,
      onOpenChange: undefined,
    }),
    floatingId,
    triggerCount: 0,
    preventUnmountingOnClose: false,
    payload: undefined,
    activeTriggerId: null,
    activeTriggerElement: null,
    openedWithoutTrigger: false,
    openChangeReason: null,
    triggerIdProp: undefined,
    popupElement: null,
    positionerElement: null,
    activeTriggerProps: EMPTY_OBJECT as HTMLProps,
    inactiveTriggerProps: EMPTY_OBJECT as HTMLProps,
    popupProps: EMPTY_OBJECT as HTMLProps,
  };
}

export type PopupStoreContext<ChangeEventDetails> = {
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
};

type S = PopupStoreState<unknown>;

const activeTriggerIdSelector = (state: S) => state.triggerIdProp ?? state.activeTriggerId;

const openSelector = (state: S) => state.openProp ?? state.open;

const popupIdSelector = (state: S) => {
  const popupId = state.popupElement?.id ?? state.floatingId;
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
  floatingRootContext: (state: S) => state.floatingRootContext,
  triggerCount: (state: S) => state.triggerCount,
  preventUnmountingOnClose: (state: S) => state.preventUnmountingOnClose,
  payload: (state: S) => state.payload,

  activeTriggerId: activeTriggerIdSelector,
  activeTriggerElement: (state: S) => (state.mounted ? state.activeTriggerElement : null),
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
  positionerElement: (state: S) => state.positionerElement,
};

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
  state: PopupOpenState,
  open: boolean,
  trigger: Element | undefined,
  preventUnmountOnClose = false,
): PopupOpenState {
  let preventUnmountingOnClose = state.preventUnmountingOnClose;
  if (open) {
    // Opening starts a new close cycle, so clear any previous request to keep the popup mounted.
    preventUnmountingOnClose = false;
  } else if (preventUnmountOnClose) {
    preventUnmountingOnClose = true;
  }

  const triggerId = trigger?.id ?? null;
  let activeTriggerId = state.activeTriggerId;
  let activeTriggerElement = state.activeTriggerElement;

  // If a popup is closing, the `trigger` may be undefined.
  // We want to keep the previous value so that exit animations are played and focus is returned correctly.
  if (triggerId || open) {
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
 * The store of a popup Root. It holds the state every popup shares and runs every open change in
 * the same order:
 *
 * 1. `isOpenChangeIgnored` can drop the change before anything is notified.
 * 2. `getCloseTrigger` can name the trigger a close request without one reports.
 * 3. `attachPreventUnmountOnClose` adds `preventUnmountOnClose()` to the event details.
 * 4. `onOpenChange` is called and can cancel the change.
 * 5. A cancelled change goes no further.
 * 6. The interactions are notified.
 * 7. `isOpenChangeDropped` can drop the change before it is committed.
 * 8. `prepareOpenChange` runs the store's own side effects and returns its extra state.
 * 9. One update commits the change, synchronously when `isCommittedSynchronously` says so. By
 *    default only hover changes are, and a store can turn that off, as Menu does.
 * 10. `completeOpenChange` runs once the change is committed.
 *
 * Each popup store overrides only the steps where it differs.
 */
export abstract class BasePopupStore<
  State extends PopupStoreState<unknown>,
  Context extends PopupStoreContext<ChangeEventDetails>,
  Selectors extends Record<string, (state: Readonly<State>, ...args: any[]) => any>,
  ChangeEventDetails extends PopupOpenChangeEventDetails,
> extends ReactStore<Readonly<State>, Context, Selectors> {
  setOpen = (
    nextOpen: boolean,
    eventDetails: Omit<ChangeEventDetails, 'preventUnmountOnClose'>,
  ): void => {
    const details = eventDetails as ChangeEventDetails;

    if (this.isOpenChangeIgnored(nextOpen, details)) {
      return;
    }

    if (!nextOpen && details.trigger == null) {
      details.trigger = this.getCloseTrigger(details);
    }

    const shouldPreventUnmountOnClose = this.attachPreventUnmountOnClose(details);

    this.context.onOpenChange?.(nextOpen, details);

    if (details.isCanceled) {
      return;
    }

    this.state.floatingRootContext.dispatchOpenChange(nextOpen, details);

    if (this.isOpenChangeDropped(nextOpen, details)) {
      return;
    }

    const extraState = this.prepareOpenChange(nextOpen, details);

    const commit = () => {
      this.update({
        ...extraState,
        ...createPopupOpenState(
          this.state,
          nextOpen,
          details.trigger,
          shouldPreventUnmountOnClose(),
        ),
        openChangeReason: details.reason,
      } as Pick<State, keyof State>);
    };

    if (this.isCommittedSynchronously(details)) {
      ReactDOM.flushSync(commit);
    } else {
      commit();
    }

    this.completeOpenChange(nextOpen, details);
  };

  /**
   * Returns whether to drop an open change before `onOpenChange` hears about it.
   */
  protected isOpenChangeIgnored(_nextOpen: boolean, _eventDetails: ChangeEventDetails): boolean {
    return false;
  }

  /**
   * Returns the trigger to report for a close request that carries none.
   */
  protected getCloseTrigger(_eventDetails: ChangeEventDetails): Element | undefined {
    return undefined;
  }

  /**
   * Adds `preventUnmountOnClose()` to the change event details and returns whether it was called.
   */
  protected attachPreventUnmountOnClose(eventDetails: ChangeEventDetails): () => boolean {
    return attachPreventUnmountOnClose(eventDetails);
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
   * Returns whether to drop an accepted open change after the interactions have heard about it,
   * without committing it.
   */
  protected isOpenChangeDropped(_nextOpen: boolean, _eventDetails: ChangeEventDetails): boolean {
    return false;
  }

  /**
   * Returns whether to commit an open change synchronously. Hover changes are, so
   * `node.getAnimations()` sees the new state.
   */
  protected isCommittedSynchronously(eventDetails: ChangeEventDetails): boolean {
    return eventDetails.reason === REASONS.triggerHover;
  }

  /**
   * Runs the store's own side effects once an open change is committed.
   */
  protected completeOpenChange(_nextOpen: boolean, _eventDetails: ChangeEventDetails): void {}
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
