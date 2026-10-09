/**
 * The rules that decide which trigger owns a popup, written as state transitions.
 *
 * A popup is owned by at most one registered trigger at a time: the trigger that opened it, or
 * one that claimed it later. The owner's id and element are kept in `activeTriggerId` and
 * `activeTriggerElement`; the rest of the bookkeeping lives under `triggerOwnership`. Every write
 * to these fields goes through a function in this module. The functions are pure: they read the
 * current ownership state (and the trigger registry where a rule depends on it) and return what to
 * commit. Most return only the fields that change, or `null` when nothing does; `applyOpenRequest`
 * and `createTriggerOwnership` return a full ownership state, and `followAnchor` a full record.
 */

/**
 * The bookkeeping the ownership rules need besides the owner itself.
 */
export interface TriggerOwnershipRecord {
  /**
   * The last trigger the mounted popup was anchored to. Unlike `activeTriggerElement`, it is kept
   * once the popup unmounts, so the interaction hooks still recognize the trigger the popup last
   * belonged to.
   */
  readonly lastTriggerElement: Element | null;
  /**
   * Whether the popup is open because of a request that deliberately carried no trigger, such as a
   * handle's `open(null)` or `openWithPayload()`. While set, no trigger claims the popup
   * implicitly, so its trigger-owned state (such as `payload`) is not forwarded. Cleared once the
   * popup is effectively closed.
   */
  readonly openedWithoutTrigger: boolean;
  /**
   * The owner id once it has matched a registered trigger during this open session, or `null`
   * while the owner is still pending (it has not registered yet). Only a resolved owner that
   * unregisters counts as lost.
   */
  readonly resolvedTriggerId: string | null;
  /**
   * Changes whenever a trigger registers or unregisters while the popup is open. The Root
   * subscribes to it to settle ownership after every registry change, including a commit where
   * one trigger replaces another and the number of triggers nets out unchanged.
   */
  readonly registryVersion: number;
  /**
   * Whether exactly one trigger was registered when the open popup last synced with the registry.
   */
  readonly hasLoneTrigger: boolean;
}

/**
 * The popup state the ownership rules read and write.
 */
export interface TriggerOwnershipState {
  /**
   * Registered id of the trigger that owns the popup.
   */
  readonly activeTriggerId: string | null;
  /**
   * Element of the trigger that owns the popup.
   */
  readonly activeTriggerElement: Element | null;
  readonly triggerOwnership: TriggerOwnershipRecord;
}

/**
 * Ownership fields to commit. Only the fields that change are present.
 */
export type TriggerOwnershipChanges = {
  -readonly [Key in keyof TriggerOwnershipState]?: TriggerOwnershipState[Key];
};

/**
 * The registered triggers of a popup, keyed by their registered id.
 */
export interface TriggerRegistry {
  readonly size: number;
  getById(id: string): Element | undefined;
  entries(): IterableIterator<[string, Element]>;
}

const INITIAL_RECORD: TriggerOwnershipRecord = {
  lastTriggerElement: null,
  openedWithoutTrigger: false,
  resolvedTriggerId: null,
  registryVersion: 0,
  hasLoneTrigger: false,
};

/**
 * Returns the ownership state of a popup that has not been opened yet.
 *
 * @param activeTriggerId The id of the trigger that owns the popup from the start, such as the
 *   `defaultTriggerId` of a popup that is open by default.
 */
export function createTriggerOwnership(
  activeTriggerId: string | null = null,
): TriggerOwnershipState {
  return { activeTriggerId, activeTriggerElement: null, triggerOwnership: INITIAL_RECORD };
}

function withRecord(
  state: TriggerOwnershipState,
  changes: Partial<TriggerOwnershipRecord>,
): TriggerOwnershipRecord {
  const record = state.triggerOwnership;
  for (const key of Object.keys(changes) as Array<keyof TriggerOwnershipRecord>) {
    if (record[key] !== changes[key]) {
      return { ...record, ...changes };
    }
  }
  return record;
}

/**
 * Open or close request.
 *
 * An open request makes its trigger the owner, or leaves the popup without one when it carries no
 * trigger. A close request keeps the owner unless it names a trigger, so exit animations play and
 * focus returns to the trigger that opened the popup. The trigger is identified by its DOM id here;
 * settling hands the owner over to the trigger's registered id when the two differ.
 *
 * @param state The current ownership state.
 * @param open Whether the request opens the popup.
 * @param trigger The trigger the request came from, if any.
 */
export function applyOpenRequest(
  state: TriggerOwnershipState,
  open: boolean,
  trigger: Element | undefined,
): TriggerOwnershipState {
  const triggerId = trigger?.id ?? null;

  let { activeTriggerId, activeTriggerElement } = state;
  if (triggerId || open) {
    activeTriggerId = triggerId;
    activeTriggerElement = trigger ?? null;
  }

  return {
    activeTriggerId,
    activeTriggerElement,
    // Controlled and default opens never pass through here, so they keep claiming a lone trigger.
    // A close request keeps the flag: a controlled root may decline it and stay open, so the flag
    // is cleared only once the popup is effectively closed (see `settleTriggerOwnership`).
    triggerOwnership: withRecord(state, {
      openedWithoutTrigger: open ? trigger == null : state.triggerOwnership.openedWithoutTrigger,
    }),
  };
}

/**
 * Registry change: a trigger registered or unregistered.
 *
 * Nothing changes while the popup is closed, so registering closed triggers notifies nobody. While
 * the popup is open, the registry version moves on so the Root settles ownership again.
 *
 * Call it after the registry itself has changed.
 *
 * @param state The current ownership state.
 * @param registry The registered triggers, including the change.
 * @param open Whether the popup is open.
 */
export function changeTriggerRegistry(
  state: TriggerOwnershipState,
  registry: TriggerRegistry,
  open: boolean,
): TriggerOwnershipChanges | null {
  if (!open) {
    return null;
  }

  return {
    triggerOwnership: withRecord(state, {
      registryVersion: state.triggerOwnership.registryVersion + 1,
      hasLoneTrigger: registry.size === 1,
    }),
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

  if (ownerId == null && open && !state.triggerOwnership.openedWithoutTrigger) {
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
 * Claim rule of a submenu trigger that registers.
 *
 * A submenu trigger claims its open submenu when it already owns it or when the submenu has no
 * owner. Unlike `claimOnRegister`, it ignores whether the submenu was opened without a trigger.
 *
 * @param triggerId The registered id of the submenu trigger.
 * @param element The submenu trigger element.
 * @param open Whether the submenu is open.
 * @param ownerId The effective owner id.
 * @param ownerElement The owner element the submenu currently exposes.
 */
export function claimSubmenuOnRegister(
  triggerId: string | undefined,
  element: Element,
  open: boolean,
  ownerId: string | null,
  ownerElement: Element | null,
): TriggerOwnershipChanges | null {
  if (open && (ownerElement === element || ownerId == null)) {
    return { activeTriggerId: triggerId ?? null, activeTriggerElement: element };
  }
  return null;
}

/**
 * Owner element change: sets the owner's element. Regular triggers call it while they own the
 * mounted popup; a submenu trigger calls it whenever its element ref changes, with `null` when the
 * element detaches.
 *
 * @param element The element to record as the owner's.
 */
export function setOwnerElement(element: Element | null): TriggerOwnershipChanges {
  return { activeTriggerElement: element };
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
 * @returns The ownership changes, and the id of the owner that was lost, if any.
 */
export function settleTriggerOwnership(
  state: TriggerOwnershipState,
  registry: TriggerRegistry,
  open: boolean,
  ownerId: string | null,
): { changes: TriggerOwnershipChanges | null; lostTriggerId: string | null } {
  const record = state.triggerOwnership;

  if (!open) {
    const triggerOwnership = withRecord(state, {
      resolvedTriggerId: null,
      openedWithoutTrigger: false,
      hasLoneTrigger: false,
    });
    return {
      changes: triggerOwnership === record ? null : { triggerOwnership },
      lostTriggerId: null,
    };
  }

  const changes: TriggerOwnershipChanges = {};
  let resolvedTriggerId = record.resolvedTriggerId;
  let lostTriggerId: string | null = null;

  if (ownerId) {
    const ownerElement = registry.getById(ownerId);
    if (ownerElement) {
      resolvedTriggerId = ownerId;
      if (ownerElement !== state.activeTriggerElement) {
        changes.activeTriggerElement = ownerElement;
      }
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
  if (!ownerId && isLoneTriggerClaimable(state, registry.size === 1)) {
    const iteratorResult = registry.entries().next();
    if (!iteratorResult.done) {
      const [loneTriggerId, loneTriggerElement] = iteratorResult.value;
      changes.activeTriggerId = loneTriggerId;
      changes.activeTriggerElement = loneTriggerElement;
      resolvedTriggerId = loneTriggerId;
    }
  }

  const triggerOwnership = withRecord(state, {
    resolvedTriggerId,
    hasLoneTrigger: registry.size === 1,
  });
  if (triggerOwnership !== record) {
    changes.triggerOwnership = triggerOwnership;
  }

  return {
    changes: Object.keys(changes).length > 0 ? changes : null,
    lostTriggerId,
  };
}

/**
 * Whether a lost owner is still lost once the deferred check runs: the popup is open, the owner
 * hasn't changed, and no trigger has registered under its id in the meantime.
 */
export function isTriggerStillLost(
  lostTriggerId: string,
  registry: TriggerRegistry,
  open: boolean,
  ownerId: string | null,
) {
  return open && ownerId === lostTriggerId && !registry.getById(lostTriggerId);
}

/**
 * Lost owner: the popup closed because its owner unmounted.
 */
export function releaseLostTrigger(): TriggerOwnershipChanges {
  return { activeTriggerId: null, activeTriggerElement: null };
}

/**
 * Unmounted: the popup finished closing and unmounted. The owner is released, and the last
 * trigger is kept.
 */
export function releaseUnmountedTrigger(): TriggerOwnershipChanges {
  return { activeTriggerId: null, activeTriggerElement: null };
}

/**
 * Anchor change: the trigger the mounted popup is anchored to changed. A new anchor becomes the
 * last trigger; the anchor being cleared (as a `keepMounted` positioner does while the popup is
 * unmounted) clears it.
 *
 * @param state The current ownership state.
 * @param anchor The new anchor element.
 */
export function followAnchor(
  state: TriggerOwnershipState,
  anchor: Element | null,
): TriggerOwnershipRecord {
  return withRecord(state, { lastTriggerElement: anchor });
}

/**
 * Lone-trigger rule: whether a lone registered trigger may claim the popup, which it may unless the
 * popup was deliberately opened without a trigger. Callers check that the popup is open and has no
 * owner. Until the claim lands, the lone trigger is already associated with the popup (for example
 * through `aria-controls`).
 *
 * @param state The current ownership state.
 * @param hasLoneTrigger Whether exactly one trigger is registered.
 */
export function isLoneTriggerClaimable(state: TriggerOwnershipState, hasLoneTrigger: boolean) {
  return !state.triggerOwnership.openedWithoutTrigger && hasLoneTrigger;
}
