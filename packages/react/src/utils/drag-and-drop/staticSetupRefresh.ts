/**
 * Per-element dispatch for the draggable static-setup refresh.
 *
 * Serves `applyDraggableStaticSetup` (`draggable.ts`): the gesture styles are
 * applied from the parameters read at registration and refreshed from the live
 * registration at the next pointer press, so an imperative registration whose
 * `disabled` or `handle` changes without re-registering isn't left with stale
 * styles forever.
 *
 * The pointer sensor already listens for `pointerdown` at every document or
 * shadow root holding a draggable, so it calls {@link refreshStaticSetups} for
 * each press rather than this module binding a listener of its own.
 */

import { isElement } from '@floating-ui/utils/dom';
import { createGetterStackRegistry } from './getterStackRegistry';
import { getSharedSlot } from './sharedState';
import { getComposedParentElement } from './utils';
import type { DragCleanupFn } from './types';

/**
 * The refresh callbacks held against each element with a live static setup —
 * a stack, not a single slot, because merged-ref composition can land two
 * registrations on one node. A single slot let the second registration
 * overwrite the first's callback, and the first cleanup then deleted the
 * survivor's.
 */
const refreshes = getSharedSlot<WeakMap<Element, Array<() => void>>>(
  'staticSetupRefresh.refreshes',
  () => new WeakMap<Element, Array<() => void>>(),
);

// The same per-element hold/release the draggable, drop-target and auto-scroller
// registries use, over this module's own backing store. `refreshStaticSetups`
// reads the whole stack off `refreshes` directly, as the auto-scroller does.
const holds = createGetterStackRegistry<Element, () => void>({ entries: refreshes });

/**
 * Refresh the static setup of every registered draggable containing `target`,
 * the target of a pointer press.
 */
export function refreshStaticSetups(target: EventTarget | null): void {
  if (!isElement(target)) {
    return;
  }
  // Walk up, crossing shadow boundaries: the press lands on whatever is
  // inside the draggable — a handle button, a label — not on the draggable itself.
  //
  // Every registered ancestor is refreshed, not just the innermost: draggables
  // nest (`resolveDraggablePickup` falls through from an inner one to an outer),
  // so stopping at the first match leaves an outer draggable's setup stale
  // whenever the press happens to land inside a nested one.
  for (let node: Element | null = target; node !== null; node = getComposedParentElement(node)) {
    const stack = refreshes.get(node);
    if (stack !== undefined) {
      // Copied: a refresh can re-register, mutating the stack under the walk.
      for (const refresh of [...stack]) {
        refresh();
      }
    }
  }
}

/**
 * Refresh `element`'s static setup on the next pointer press inside it. Relies
 * on the pointer sensor being bound at `element`'s event root, which
 * `registerSource` does for every draggable. Returns a cleanup releasing the callback.
 */
export function registerStaticSetupRefresh(element: Element, refresh: () => void): DragCleanupFn {
  return holds.hold(element, refresh);
}
