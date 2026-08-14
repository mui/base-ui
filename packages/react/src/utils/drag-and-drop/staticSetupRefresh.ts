/**
 * Per-document dispatch for the draggable static-setup refresh.
 *
 * The refresh contract is documented on `registerDraggable`: the gesture styles
 * and a11y attributes are applied from the parameters read at registration and
 * refreshed "at the next interaction with the element (a pointer press, or the
 * focus a keyboard pickup starts with)", so an imperative consumer that mutates
 * parameters in place isn't left with stale attributes forever.
 *
 * The two entry points are the same events the sensors already watch, so one
 * capture pair per document or shadow root covers every draggable there — a
 * thousand-row list would otherwise carry two thousand listeners that almost
 * always hit the no-change early-out. Each interaction walks up from its target
 * and refreshes every registered draggable on the way.
 */

import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { getTarget } from '@base-ui/utils/shadowDom';
import { isElement } from '@floating-ui/utils/dom';
import { createDocumentBinding } from './documentBinding';
import { createGetterStackRegistry } from './getterStackRegistry';
import { getSharedSlot } from './sharedState';
import { getComposedParentElement, getDragEventRoot } from './utils';
import type { DragCleanupFn } from '../../types/drag';

interface StaticSetupRefreshState {
  /**
   * The refresh callbacks held against each element with a live static setup —
   * a stack, not a single slot, because merged-ref composition can land two
   * registrations on one node. A single slot let the second registration
   * overwrite the first's callback, and the first cleanup then deleted the
   * survivor's.
   */
  refreshes: WeakMap<Element, Array<() => void>>;
}

const state = getSharedSlot<StaticSetupRefreshState>('staticSetupRefresh', () => ({
  refreshes: new WeakMap<Element, Array<() => void>>(),
}));

// The same per-element hold/release the draggable, drop-target and auto-scroller
// registries use, over this module's own backing store. `onInteraction` reads the
// whole stack off `state.refreshes` directly, as the auto-scroller does.
const holds = createGetterStackRegistry<Element, () => void>({ entries: state.refreshes });

function onInteraction(event: Event): void {
  const target = getTarget(event);
  if (!isElement(target)) {
    return;
  }
  // Walk up, crossing shadow boundaries: the press or focus lands on whatever is
  // inside the draggable — a handle button, a label — not on the draggable itself.
  //
  // Every registered ancestor is refreshed, not just the innermost: draggables
  // nest (`resolveDraggablePickup` falls through from an inner one to an outer),
  // so stopping at the first match leaves an outer draggable's ARIA stale
  // whenever the press happens to land inside a nested one.
  for (let node: Element | null = target; node !== null; node = getComposedParentElement(node)) {
    const refreshes = state.refreshes.get(node);
    if (refreshes !== undefined) {
      // Copied: a refresh can re-register, mutating the stack under the walk.
      for (const refresh of [...refreshes]) {
        refresh();
      }
    }
  }
}

const documentBinding = createDocumentBinding({
  slot: 'staticSetupRefresh.documentBindings',
  install: (doc) => {
    // Capture-phase, so a consumer handler stopping propagation can't starve it.
    const offPointerDown = addEventListener(doc, 'pointerdown', onInteraction, { capture: true });
    const offFocusIn = addEventListener(doc, 'focusin', onInteraction, { capture: true });
    return mergeCleanups(offPointerDown, offFocusIn);
  },
});

/**
 * Refresh `element`'s static setup on the next pointer press or focus inside it.
 * Returns a cleanup releasing both the callback and this event root's listener share.
 */
export function registerStaticSetupRefresh(element: Element, refresh: () => void): DragCleanupFn {
  const release = holds.hold(element, refresh);
  // Captured once, so the cleanup releases the share it actually took: an
  // element adopted into another document mid-life would otherwise decrement a
  // counter it never incremented, tearing down that document's listeners under
  // a live draggable.
  const root = getDragEventRoot(element);
  documentBinding.bind(root);
  return () => {
    release();
    documentBinding.unbind(root);
  };
}
