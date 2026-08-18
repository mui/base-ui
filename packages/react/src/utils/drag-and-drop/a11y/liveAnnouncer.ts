/**
 * Polite ARIA live region for drag-and-drop screen-reader announcements.
 *
 * One hidden `role="status"` node per owner document, created lazily. Messages
 * are written to a text node so a repeated string still re-triggers the
 * announcement.
 */

import { ownerDocument } from '@base-ui/utils/owner';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { WindowTimeout } from '@base-ui/utils/windowTimeout';
import { getSharedSlot } from '../sharedState';

export interface Announcer {
  announce(message: string, debounceMs?: number): void;
  /** Drop a pending debounced announcement without writing it. */
  cancelPending(): void;
  destroy(): void;
}

interface AnnouncerState {
  byDocument: WeakMap<Document, Announcer>;
  /**
   * Enumerable companion to {@link byDocument}, which is a `WeakMap` and cannot be
   * walked. Exists only so `resetAnnouncerForTests()` can reach a region created in
   * another document (an iframe, a popout). The references are weak, so a removed
   * iframe's document stays collectable.
   */
  documents: Set<WeakRef<Document>>;
}

const state = getSharedSlot<AnnouncerState>('liveAnnouncer', () => ({
  byDocument: new WeakMap<Document, Announcer>(),
  documents: new Set<WeakRef<Document>>(),
}));

/**
 * Zero-width space appended to a repeated announcement to force a text-node
 * change so a screen reader re-announces it. Inaudible and invisible.
 */
const REPEAT_MARKER = '\u200B';

function createAnnouncer(doc: Document): Announcer {
  const node = doc.createElement('div');
  node.setAttribute('role', 'status');
  node.setAttribute('aria-live', 'polite');
  node.setAttribute('aria-atomic', 'true');
  Object.assign(node.style, visuallyHidden);
  const textNode = doc.createTextNode('');
  node.appendChild(textNode);
  // `body` can be null for a document registered against before its `<body>`
  // is parsed (imperative registration from a head script).
  (doc.body ?? doc.documentElement).appendChild(node);

  const debounceTimer = new WindowTimeout(doc.defaultView ?? window);
  let destroyed = false;
  // The last message written, and a toggle used to force a content change when
  // the same message is announced twice in a row (see `write`).
  let lastMessage: string | null = null;
  let repeatToggle = false;

  function write(message: string): void {
    // A same-tick `data = ''; data = message` leaves the final text equal to the
    // previous value, so an identical repeated message (arrow down, up, down)
    // produces no content change and no live-region event. Keep the write
    // synchronous — screen readers and tests read the region immediately — and
    // when the message repeats, toggle a trailing zero-width space so the text
    // node actually changes and the announcement re-fires. The marker is
    // inaudible and invisible, and distinct messages are written verbatim.
    if (message === lastMessage) {
      repeatToggle = !repeatToggle;
      textNode.data = repeatToggle ? `${message}${REPEAT_MARKER}` : message;
    } else {
      repeatToggle = false;
      textNode.data = message;
    }
    lastMessage = message;
  }

  const announcer: Announcer = {
    announce(message: string, debounceMs = 0): void {
      if (destroyed) {
        return;
      }
      if (debounceMs > 0) {
        debounceTimer.start(debounceMs, () => write(message));
      } else {
        debounceTimer.clear();
        write(message);
      }
    },
    cancelPending(): void {
      debounceTimer.clear();
    },
    destroy(): void {
      if (destroyed) {
        return;
      }
      destroyed = true;
      debounceTimer.clear();
      node.remove();
      // Drop the cache entry so a later `getAnnouncer(doc)` recreates a live
      // region rather than handing back this destroyed (no-op) announcer.
      if (state.byDocument.get(doc) === announcer) {
        state.byDocument.delete(doc);
      }
    },
  };
  return announcer;
}

/**
 * Get (creating on first use) the live announcer for `reference`'s document.
 *
 * The region is deliberately never torn down once created (`destroy()` is
 * test-only): screen readers announce writes into a long-standing live region
 * far more reliably than into one inserted near the message, so it persists
 * for the document's lifetime — one hidden node — rather than being
 * ref-counted like the keyboard-instructions node.
 */
export function getAnnouncer(reference: Element): Announcer {
  const doc = ownerDocument(reference);
  let announcer = state.byDocument.get(doc);
  if (!announcer) {
    announcer = createAnnouncer(doc);
    state.byDocument.set(doc, announcer);
    if (process.env.NODE_ENV !== 'production') {
      // Test-only bookkeeping (see `resetAnnouncerForTests`), stripped from
      // production builds: nothing there ever destroys a region, so the set would
      // only accumulate spent `WeakRef` husks for the life of the page.
      state.documents.add(new WeakRef(doc));
    }
  }
  return announcer;
}

/**
 * Remove the live-region nodes, and with them the announcement timeouts they have
 * armed. Test-only.
 *
 * With no argument this reaches *every* document an announcer was created in, not
 * just the main one: a test driving a drag inside an iframe or a popout creates a
 * region there, and `byDocument` is a `WeakMap` that cannot be walked — so those
 * regions, and any pending coalescing timeout, used to leak into the next test.
 */
export function resetAnnouncerForTests(doc?: Document): void {
  if (doc !== undefined) {
    destroyAnnouncerIn(doc);
    return;
  }
  for (const ref of state.documents) {
    const target = ref.deref();
    if (target) {
      destroyAnnouncerIn(target);
    }
  }
  state.documents.clear();
}

function destroyAnnouncerIn(doc: Document): void {
  const announcer = state.byDocument.get(doc);
  if (announcer) {
    announcer.destroy();
    state.byDocument.delete(doc);
  }
}
