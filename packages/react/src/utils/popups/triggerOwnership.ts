/**
 * The rules that decide which trigger owns a popup, written as state transitions.
 *
 * A popup is owned by at most one registered trigger at a time: the trigger that opened it, or
 * one that claimed it later. The owner's id and element are kept in `activeTriggerId` and
 * `activeTriggerElement`. The functions are pure: they read the current ownership state (and the
 * trigger registry where a rule depends on it) and return what to commit.
 */
import type { PopupStoreState } from './store';
import type { PopupTriggerMap } from './popupTriggerMap';

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
 * Ownership fields to commit. A field that is present is never `undefined`.
 */
type TriggerOwnershipChanges = Partial<TriggerOwnershipState>;

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
 * @returns The ownership changes, or `null` when the trigger doesn't claim the popup. A trigger
 *   that claims an open popup forwards its trigger-owned state along with the changes.
 */
export function claimOnRegister(
  state: TriggerOwnershipState,
  triggerId: string | undefined,
  element: Element,
  open: boolean,
  ownerId: string | null,
): TriggerOwnershipChanges | null {
  if (ownerId === triggerId) {
    return { activeTriggerElement: element };
  }

  if (ownerId == null && open && !state.openedWithoutTrigger) {
    // A detached trigger can mount into an open popup before any owner has been established.
    // Claiming it lets trigger-owned focus management and ARIA relationships work.
    return { activeTriggerId: triggerId ?? null, activeTriggerElement: element };
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
  registry: PopupTriggerMap,
  open: boolean,
  ownerId: string | null,
): [changes: TriggerOwnershipChanges, lostTriggerId: string | null] {
  if (!open) {
    return [{ resolvedTriggerId: null, openedWithoutTrigger: false, hasLoneTrigger: false }, null];
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
  } else if (hasLoneTrigger && !state.openedWithoutTrigger) {
    // A lost owner still has an id, so only a popup that has no owner at all claims a lone trigger.
    const [[loneTriggerId, loneTriggerElement]] = registry.entries();
    changes.activeTriggerId = loneTriggerId;
    changes.activeTriggerElement = loneTriggerElement;
    resolvedTriggerId = loneTriggerId;
  } else {
    resolvedTriggerId = null;
  }

  changes.resolvedTriggerId = resolvedTriggerId;
  return [changes, lostTriggerId];
}
