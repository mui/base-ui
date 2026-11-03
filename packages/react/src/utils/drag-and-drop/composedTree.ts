/**
 * Walks and hit-tests over the composed tree. A closed shadow root hides its slots
 * (`assignedSlot` is `null`) and its content (`host.shadowRoot` is `null`), so each
 * registration holds the closed roots it lives in, and every walk reads them here.
 */

import { contains } from '@base-ui/utils/shadowDom';
import { isShadowRoot } from '@floating-ui/utils/dom';
import { getParentElement } from '../getParentElement';
import { getElementAtPoint } from '../getElementAtPoint';
import { getSharedSlot } from './sharedState';
import type { DragCleanupFn } from './types';

interface ClosedRootEntry {
  root: ShadowRoot;
  /** Holds on this root, since several registrations can live in one. */
  count: number;
}

// Shared across bundle copies, since the copy that registers can differ from the one that walks.
const closedRootsByHost = getSharedSlot<Map<Element, ClosedRootEntry>>(
  'composedTree.closedRootsByHost',
  () => new Map(),
);

/**
 * Make the closed shadow roots holding `element`, ancestor roots included, visible to the
 * walks below until the returned release runs. The roots are read now, so a node that moves
 * later still releases what it held.
 */
export function holdClosedShadowRoots(element: Element): DragCleanupFn {
  const held: ClosedRootEntry[] = [];
  for (let root = element.getRootNode(); isShadowRoot(root); root = root.host.getRootNode()) {
    if (root.mode !== 'closed') {
      continue;
    }
    let entry = closedRootsByHost.get(root.host);
    if (entry === undefined) {
      entry = { root, count: 0 };
      closedRootsByHost.set(root.host, entry);
    }
    entry.count += 1;
    held.push(entry);
  }
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    for (const entry of held) {
      entry.count -= 1;
      // The identity check keeps a release that outlived `resetForTests` from
      // dropping a later hold's entry.
      if (entry.count === 0 && closedRootsByHost.get(entry.root.host) === entry) {
        closedRootsByHost.delete(entry.root.host);
      }
    }
  };
}

function getShadowRoot(host: Element): ShadowRoot | undefined {
  return host.shadowRoot ?? closedRootsByHost.get(host)?.root;
}

/**
 * The parent of `element` in the composed tree: its assigned slot, then its parent, then
 * its shadow host. `assignedSlot` is `null` for a slot in a closed shadow root, which would
 * skip whatever wraps the `<slot>`, so the slot is looked up in the held closed roots.
 */
export function getComposedParentElement(element: Element): Element | null {
  if (closedRootsByHost.size > 0 && element.assignedSlot === null) {
    const host = element.parentElement;
    const root = host === null ? undefined : closedRootsByHost.get(host)?.root;
    if (root !== undefined) {
      for (const slot of root.querySelectorAll('slot')) {
        if (slot.assignedElements().includes(element)) {
          return slot;
        }
      }
    }
  }
  return getParentElement(element);
}

/**
 * Hit-tests the point, descending into shadow roots since `elementFromPoint` stops at the
 * host, including the held closed roots `Element.shadowRoot` hides. It must not throw. It
 * runs from the activation commit, outside any containment, where a `TypeError` would leave
 * the sensor refusing every later pickup.
 */
export function deepElementFromPoint(
  doc: Document,
  clientX: number,
  clientY: number,
): Element | null {
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
    return null;
  }
  let hit = getElementAtPoint(doc, clientX, clientY);
  let innerRoot = hit ? getShadowRoot(hit) : undefined;
  while (innerRoot) {
    const inner = getElementAtPoint(innerRoot, clientX, clientY);
    if (!inner || inner === hit) {
      break;
    }
    hit = inner;
    innerRoot = getShadowRoot(hit);
  }
  return hit;
}

/**
 * {@link deepElementFromPoint}, skipping the drag preview. Consumer preview content
 * can set `pointer-events: auto` and would then pin drop-target resolution to the
 * preview. On such a hit, hide the preview synchronously and hit-test again. No
 * repaint happens in between, so nothing flickers.
 */
export function elementFromPointIgnoring(
  doc: Document,
  clientX: number,
  clientY: number,
  ignore: HTMLElement | null,
): Element | null {
  const found = deepElementFromPoint(doc, clientX, clientY);
  if (!found || ignore == null || !contains(ignore, found)) {
    return found;
  }
  // Not `visibility: hidden`, which a descendant can override with `visibility: visible`.
  const previousDisplay = ignore.style.display;
  ignore.style.display = 'none';
  const behind = deepElementFromPoint(doc, clientX, clientY);
  ignore.style.display = previousDisplay;
  return behind;
}

/** Test-only. Forgets every held root, so one a failed test leaked can't reach the next. */
export function resetForTests(): void {
  closedRootsByHost.clear();
}
