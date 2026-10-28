/**
 * The rules that decide which trigger owns a popup, written as state transitions.
 *
 * A popup is owned by at most one registered trigger at a time: the trigger that opened it, or
 * one that claimed it later. The owner's id and element are kept in `activeTriggerId` and
 * `activeTriggerElement`. The functions are pure: they read the current ownership state (and the
 * trigger registry where a rule depends on it) and return what to commit.
 */
import type { PopupStoreState } from './store';

/**
 * The popup state the ownership rules read and write.
 */
export type TriggerOwnershipState = Pick<
  PopupStoreState<unknown>,
  | 'activeTriggerId'
  | 'activeTriggerElement'
  | 'openedWithoutTrigger'
  | 'resolvedTriggerId'
  | 'registryVersion'
  | 'hasLoneTrigger'
>;

/**
 * Ownership fields to commit. Only the fields that change are present.
 */
export type TriggerOwnershipChanges = Partial<TriggerOwnershipState>;

type OpenRequestState = Pick<
  TriggerOwnershipState,
  'activeTriggerId' | 'activeTriggerElement' | 'openedWithoutTrigger'
>;

/**
 * The registered triggers of a popup, keyed by their registered id.
 */
export interface TriggerRegistry {
  readonly size: number;
  getById(id: string): Element | undefined;
  entries(): IterableIterator<[string, Element]>;
}

/**
 * Returns the ownership state of a popup that has not been opened yet.
 *
 * @param activeTriggerId The id of the trigger that owns the popup from the start, such as the
 *   `defaultTriggerId` of a popup that is open by default.
 */
export function createTriggerOwnership(
  activeTriggerId: string | null = null,
): TriggerOwnershipState {
  return {
    activeTriggerId,
    activeTriggerElement: null,
    openedWithoutTrigger: false,
    resolvedTriggerId: null,
    registryVersion: 0,
    hasLoneTrigger: false,
  };
}

/**
 * Open or close request.
 *
 * An open request makes its trigger the owner, or leaves the popup without one when it carries no
 * trigger. A close request keeps the owner unless it names a different trigger, so exit animations
 * play and focus returns to the trigger that opened the popup. The trigger is identified by its DOM id here;
 * settling hands the owner over to the trigger's registered id when the two differ.
 *
 * @param state The current ownership state.
 * @param open Whether the request opens the popup.
 * @param trigger The trigger the request came from, if any.
 */
export function applyOpenRequest(
  state: OpenRequestState,
  open: boolean,
  trigger: Element | undefined,
): OpenRequestState {
  const triggerId = trigger?.id ?? null;

  let { activeTriggerId, activeTriggerElement } = state;
  // The active id can differ from the element's own `id` once the Root matches the element to its
  // registered trigger id, so a close naming the active trigger keeps it.
  if (open || (triggerId && trigger !== state.activeTriggerElement)) {
    activeTriggerId = triggerId;
    activeTriggerElement = trigger ?? null;
  }

  return {
    activeTriggerId,
    activeTriggerElement,
    // Controlled and default opens never pass through here, so they keep claiming a lone trigger.
    // A close request keeps the flag: a controlled root may decline it and stay open, so the flag
    // is cleared only once the popup is effectively closed (see `settleTriggerOwnership`).
    openedWithoutTrigger: open ? trigger == null : state.openedWithoutTrigger,
  };
}

/**
 * Claim rule of a trigger that registers.
 *
 * The owner refreshes its element. Otherwise, a trigger that registers while the popup is open and
 * unowned claims it (the first registrant wins), unless the popup was deliberately opened without
 * a trigger.
 *
 * @param state The current ownership state.
 * @param triggerId The registered id of the trigger.
 * @param element The trigger element.
 * @param open Whether the popup is open.
 * @param ownerId The effective owner id, which a controlled `triggerId` prop overrides.
 * @returns The ownership changes, and whether the trigger should forward its trigger-owned state.
 */
export function claimOnRegister(
  state: TriggerOwnershipState,
  triggerId: string | undefined,
  element: Element,
  open: boolean,
  ownerId: string | null,
): { changes: TriggerOwnershipChanges; forwardState: boolean } | null {
  if (ownerId === triggerId) {
    return { changes: { activeTriggerElement: element }, forwardState: open };
  }

  if (ownerId == null && open && !state.openedWithoutTrigger) {
    // A detached trigger can mount into an open popup before any owner has been established.
    // Claiming it lets trigger-owned focus management and ARIA relationships work.
    return {
      changes: { activeTriggerId: triggerId ?? null, activeTriggerElement: element },
      forwardState: true,
    };
  }

  return null;
}

/**
 * Settle: what the Root runs after every commit that changed the open state, the owner or the
 * registry.
 *
 * - While closed, the session bookkeeping is reset.
 * - A registered owner refreshes its element and becomes resolved.
 * - An owner whose id isn't registered, but whose element is registered under another id (the
 *   rendered trigger carries its own DOM id), is handed over to the registered id.
 * - Any other resolved owner that is no longer registered is reported as lost; a pending one is
 *   kept.
 * - An unowned popup claims a lone registered trigger, unless it was opened without a trigger.
 *
 * @param state The current ownership state.
 * @param registry The registered triggers.
 * @param open Whether the popup is open.
 * @param ownerId The effective owner id, which a controlled `triggerId` prop overrides.
 * @returns The ownership fields to commit, and the id of the owner that was lost, if any. Fields
 *   that keep their value may be included.
 */
export function settleTriggerOwnership(
  state: TriggerOwnershipState,
  registry: TriggerRegistry,
  open: boolean,
  ownerId: string | null,
): { changes: TriggerOwnershipChanges; lostTriggerId: string | null } {
  if (!open) {
    return {
      changes: { resolvedTriggerId: null, openedWithoutTrigger: false, hasLoneTrigger: false },
      lostTriggerId: null,
    };
  }

  const hasLoneTrigger = registry.size === 1;
  const changes: TriggerOwnershipChanges = { hasLoneTrigger };
  let resolvedTriggerId = state.resolvedTriggerId;
  let lostTriggerId: string | null = null;

  if (ownerId) {
    const ownerElement = registry.getById(ownerId);
    if (ownerElement) {
      resolvedTriggerId = ownerId;
      changes.activeTriggerElement = ownerElement;
    } else {
      for (const [registeredId, registeredElement] of registry.entries()) {
        if (registeredElement === state.activeTriggerElement) {
          changes.activeTriggerId = registeredId;
          changes.activeTriggerElement = registeredElement;
          resolvedTriggerId = registeredId;
          break;
        }
      }

      if (changes.activeTriggerId === undefined) {
        if (resolvedTriggerId === ownerId) {
          lostTriggerId = ownerId;
        } else {
          resolvedTriggerId = null;
        }
      }
    }
  } else {
    resolvedTriggerId = null;
  }

  // A lost owner still has an id, so `!ownerId` also rules out claiming after losing one.
  if (!ownerId && hasLoneTrigger && !state.openedWithoutTrigger) {
    const iteratorResult = registry.entries().next();
    if (!iteratorResult.done) {
      const [loneTriggerId, loneTriggerElement] = iteratorResult.value;
      changes.activeTriggerId = loneTriggerId;
      changes.activeTriggerElement = loneTriggerElement;
      resolvedTriggerId = loneTriggerId;
    }
  }

  changes.resolvedTriggerId = resolvedTriggerId;
  return { changes, lostTriggerId };
}
