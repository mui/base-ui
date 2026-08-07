import { NOOP } from '@base-ui/utils/empty';
import { ownerWindow } from '@base-ui/utils/owner';
import { activeElementInRoot, contains } from './element';
import type { FocusableElement } from './tabbable';

type FocusIntentKind = 'primary' | 'fallback';

interface Options {
  preventScroll?: boolean | undefined;
  sync?: boolean | undefined;
  /**
   * Primary intents represent an explicit focus destination, such as an item
   * selected by keyboard navigation. Fallback intents are defaults that should
   * only run when no primary intent can take focus.
   *
   * @default 'primary'
   */
  intent?: FocusIntentKind | undefined;
  // Called when the frame runs to decide whether focus should still be applied.
  shouldFocus?: (() => boolean) | undefined;
}

interface FocusIntent {
  target: FocusableElement;
  preventScroll: boolean;
  shouldFocus: (() => boolean) | undefined;
}

interface FocusQueue {
  frameId: number;
  window: Window;
  primary: FocusIntent | null;
  fallback: FocusIntent | null;
}

// Focus is singleton state within a document. Keeping independent queues per
// element could focus several elements in one frame, producing observable
// focus/blur churn. A document queue instead commits at most one successful
// focus transition per frame, while preserving isolation between documents.
const focusQueues = new WeakMap<Document, FocusQueue>();

function isFocusWithin(target: FocusableElement) {
  const currentActiveElement = activeElementInRoot(target);

  // A fallback container already fulfills its purpose when one of its
  // descendants has focus. Treating that as success avoids moving focus from
  // consumer content back to the container merely to satisfy exact identity.
  return currentActiveElement === target || contains(target, currentActiveElement);
}

function executeFocusIntent(focusIntent: FocusIntent | null) {
  if (
    focusIntent == null ||
    !focusIntent.target.isConnected ||
    focusIntent.shouldFocus?.() === false
  ) {
    return false;
  }

  // A blurred document can retain a stale `activeElement`. Only skip `.focus()`
  // when the document itself has focus; after calling it, root-local active
  // element state tells us whether the target accepted focus.
  const targetAlreadyHasFocus =
    focusIntent.target.ownerDocument.hasFocus() && isFocusWithin(focusIntent.target);

  if (!targetAlreadyHasFocus) {
    focusIntent.target.focus({ preventScroll: focusIntent.preventScroll });
  }

  return isFocusWithin(focusIntent.target);
}

function flushFocusQueue(doc: Document, queue: FocusQueue) {
  if (focusQueues.get(doc) !== queue) {
    return;
  }

  // Remove the queue before focusing. A focus event may enqueue another intent,
  // which must belong to the next frame rather than mutate the queue being run.
  focusQueues.delete(doc);

  // A fallback is attempted only if the primary intent became invalid or its
  // focus call did not move focus. This lets initial-focus defaults coexist with
  // a more specific navigation target without an intermediate focus transition.
  if (!executeFocusIntent(queue.primary)) {
    executeFocusIntent(queue.fallback);
  }
}

function cancelFocusQueue(doc: Document, queue: FocusQueue) {
  if (focusQueues.get(doc) !== queue) {
    return;
  }

  queue.window.cancelAnimationFrame(queue.frameId);
  focusQueues.delete(doc);
}

export function enqueueFocus(el: FocusableElement | null, options: Options = {}) {
  const {
    preventScroll = false,
    sync = false,
    intent: intentKind = 'primary',
    shouldFocus,
  } = options;

  if (!el) {
    return NOOP;
  }

  const doc = el.ownerDocument;
  const focusIntent: FocusIntent = {
    target: el,
    preventScroll,
    shouldFocus,
  };

  if (sync) {
    const pendingQueue = focusQueues.get(doc);
    const pendingPrimary = pendingQueue?.primary;
    const pendingFallback = pendingQueue?.fallback;
    const focusSucceeded = executeFocusIntent(focusIntent);

    if (pendingQueue && focusQueues.get(doc) === pendingQueue) {
      if (focusSucceeded) {
        // Clear only the intents that predated this focus call. A focus handler
        // may have enqueued fresh work that belongs to the pending frame.
        if (pendingQueue.primary === pendingPrimary) {
          pendingQueue.primary = null;
        }
        if (pendingQueue.fallback === pendingFallback) {
          pendingQueue.fallback = null;
        }
      } else {
        // A failed synchronous primary supersedes an older primary, but the
        // fallback remains eligible on its original frame.
        const pendingIntent = intentKind === 'primary' ? pendingPrimary : pendingFallback;
        if (pendingQueue[intentKind] === pendingIntent) {
          pendingQueue[intentKind] = null;
        }
      }

      if (pendingQueue.primary == null && pendingQueue.fallback == null) {
        cancelFocusQueue(doc, pendingQueue);
      }
    }

    return NOOP;
  }

  let queue = focusQueues.get(doc);
  if (!queue) {
    const createdQueue: FocusQueue = {
      frameId: 0,
      window: ownerWindow(el),
      primary: null,
      fallback: null,
    };
    createdQueue[intentKind] = focusIntent;
    focusQueues.set(doc, createdQueue);
    // The shared `AnimationFrame` scheduler is bound to the module's realm.
    // Focus queues must instead follow the target document's window so iframe
    // work is scheduled and cancelled in that document's rendering lifecycle.
    createdQueue.frameId = createdQueue.window.requestAnimationFrame(() =>
      flushFocusQueue(doc, createdQueue),
    );
    queue = createdQueue;
  } else {
    // Only the latest intent of each kind is relevant.
    queue[intentKind] = focusIntent;
  }

  // The returned cancellation closure checks identity so a stale caller cannot
  // cancel its replacement.
  return () => {
    if (focusQueues.get(doc) !== queue || queue[intentKind] !== focusIntent) {
      return;
    }

    queue[intentKind] = null;
    if (queue.primary == null && queue.fallback == null) {
      cancelFocusQueue(doc, queue);
    }
  };
}
