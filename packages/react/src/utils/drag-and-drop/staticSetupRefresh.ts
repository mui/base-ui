/**
 * Per-element dispatch for the draggable static-setup refresh.
 *
 * `applyDraggableStaticSetup` (`draggable.ts`) applies the gesture styles from the
 * parameters read at registration. This module refreshes them from the live
 * registration at the next pointer press, so an imperative registration that
 * changes `disabled` or `handle` without re-registering doesn't keep stale styles.
 *
 * The pointer sensor already listens for `pointerdown` at every document or
 * shadow root holding a draggable. It calls {@link refreshStaticSetups} on each
 * press, so this module binds no listener of its own.
 */

import { isElement } from '@floating-ui/utils/dom';
import { createGetterStackRegistry } from './getterStackRegistry';
import { getSharedSlot } from './sharedState';
import { getComposedParentElement } from './utils';
import type { DragCleanupFn } from './types';

/**
 * The refresh callbacks for each element with a live static setup. Each entry
 * is a stack because merged refs can put two registrations on one node. With a
 * single slot, the second registration would overwrite the first's callback,
 * and the first cleanup would then delete the survivor's.
 */
const refreshes = getSharedSlot<WeakMap<Element, Array<() => void>>>(
  'staticSetupRefresh.refreshes',
  () => new WeakMap<Element, Array<() => void>>(),
);

// The same per-element hold/release as the draggable, drop-target and
// auto-scroller registries, backed by `refreshes`. `refreshStaticSetups` reads
// each stack from `refreshes` directly, as the auto-scroller does.
const holds = createGetterStackRegistry<Element, () => void>({ entries: refreshes });

/**
 * Refresh the static setup of every registered draggable containing `target`,
 * the target of a pointer press.
 */
export function refreshStaticSetups(target: EventTarget | null): void {
  if (!isElement(target)) {
    return;
  }
  // Walk up across shadow boundaries, since the press usually lands on a
  // descendant of the draggable, such as a handle button or a label.
  //
  // Refresh every registered ancestor, not only the innermost. Draggables nest
  // (`resolveDraggablePickup` falls through from an inner one to an outer one),
  // so stopping at the first match would leave the outer draggable's setup
  // stale when the press lands inside a nested one.
  for (let node: Element | null = target; node !== null; node = getComposedParentElement(node)) {
    const stack = refreshes.get(node);
    if (stack !== undefined) {
      // Copy first, since a refresh can re-register and mutate the stack.
      for (const refresh of [...stack]) {
        refresh();
      }
    }
  }
}

/**
 * Refresh `element`'s static setup on the next pointer press inside it. Requires
 * the pointer sensor to be bound at `element`'s event root, which
 * `registerSource` does for every draggable. Returns a cleanup that releases the
 * callback.
 */
export function registerStaticSetupRefresh(element: Element, refresh: () => void): DragCleanupFn {
  return holds.hold(element, refresh);
}
