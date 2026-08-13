/**
 * Ref-counted per-event-root listener binding, shared by the pointer and
 * keyboard sensors. Each sensor installs one listener pair per owner document
 * or shadow root and ref-counts it by the number of draggables registered there.
 *
 * The counter lives in a `getSharedSlot` map so a doubly-bundled engine still
 * shares one count per root, exactly like the sensors' other shared state.
 */

import { addEventListener } from '@base-ui/utils/addEventListener';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { isShadowRoot } from '@floating-ui/utils/dom';
import { getSharedSlot } from './sharedState';
import type { DragCleanupFn } from '../../types/drag';

export type DragEventRoot = Document | ShadowRoot;

interface DocumentBindingEntry {
  count: number;
  cleanup: DragCleanupFn;
}

export interface DocumentBinding {
  /**
   * Ref-count a listener on `root`, installing it on the first bind there.
   */
  bind(root: DragEventRoot): void;
  /**
   * Release one ref-count on `root`, running the cleanup when the last holder
   * unbinds — unless `shouldDefer` returns `true`, in which case the cleanup is
   * handed to the caller to run later (via the `onDefer` callback passed to
   * {@link createDocumentBinding}).
   */
  unbind(root: DragEventRoot): void;
}

interface CreateDocumentBindingOptions {
  /**
   * Unique slot name for the ref-count map, so each sensor keeps its own counter
   * in the shared root.
   */
  slot: string;
  /** Install the root-level listener(s); returns their cleanup. */
  install: (root: DragEventRoot) => DragCleanupFn;
  /**
   * Optional predicate consulted when the last holder unbinds. When it returns
   * `true`, the cleanup is NOT run inline; it is forwarded to `onDefer` so the
   * caller can run it later (the keyboard sensor defers a cleanup that would
   * otherwise tear down the only keydown path out from under a live drag).
   */
  shouldDefer?: ((root: DragEventRoot) => boolean) | undefined;
  /** Receives a deferred cleanup when `shouldDefer` returns `true`. */
  onDefer?: ((cleanup: DragCleanupFn) => void) | undefined;
}

export function createDocumentBinding(options: CreateDocumentBindingOptions): DocumentBinding {
  const { slot, install, shouldDefer, onDefer } = options;
  const bindings = getSharedSlot<WeakMap<DragEventRoot, DocumentBindingEntry>>(
    slot,
    () => new WeakMap<DragEventRoot, DocumentBindingEntry>(),
  );

  return {
    bind(root: DragEventRoot): void {
      const existing = bindings.get(root);
      if (existing) {
        existing.count += 1;
        return;
      }
      bindings.set(root, { count: 1, cleanup: install(root) });
    },
    unbind(root: DragEventRoot): void {
      const entry = bindings.get(root);
      if (!entry) {
        return;
      }
      entry.count -= 1;
      if (entry.count === 0) {
        bindings.delete(root);
        if (shouldDefer?.(root)) {
          onDefer?.(entry.cleanup);
        } else {
          entry.cleanup();
        }
      }
    },
  };
}

interface CreateEventRootBindingOptions {
  /** Unique shared slot prefix for this sensor. */
  slot: string;
  /** Shared slot used to coordinate shadow-root routing across bundle copies. */
  shadowRootsSlot: string;
  type: string;
  listener: (event: Event) => void;
  options?: Omit<AddEventListenerOptions, 'capture'> | undefined;
  shouldDefer?: ((root: DragEventRoot) => boolean) | undefined;
  onDefer?: ((cleanup: DragCleanupFn) => void) | undefined;
}

/**
 * Bind one sensor event across documents and shadow roots. A composed event is
 * observed by window capture before an inner shadow-root listener, so the window
 * defers those events to bubble; direct host events still fall back to the window.
 */
export function createEventRootBinding(options: CreateEventRootBindingOptions): DocumentBinding {
  const {
    slot,
    shadowRootsSlot,
    type,
    listener,
    options: listenerOptions,
    shouldDefer,
    onDefer,
  } = options;
  const boundShadowRoots = getSharedSlot<Map<ShadowRoot, number>>(
    shadowRootsSlot,
    () => new Map<ShadowRoot, number>(),
  );

  const crossesBoundShadowRoot = (event: Event, doc: Document): boolean => {
    const path = event.composedPath();
    for (const root of boundShadowRoots.keys()) {
      if (ownerDocument(root.host) === doc && path.includes(root.host)) {
        return true;
      }
    }
    return false;
  };

  return createDocumentBinding({
    slot,
    install(root) {
      if (isShadowRoot(root)) {
        boundShadowRoots.set(root, (boundShadowRoots.get(root) ?? 0) + 1);
        const off = addEventListener(root, type, listener, {
          ...listenerOptions,
          capture: true,
        });
        return () => {
          off();
          const count = boundShadowRoots.get(root) ?? 0;
          if (count <= 1) {
            boundShadowRoots.delete(root);
          } else {
            boundShadowRoots.set(root, count - 1);
          }
        };
      }

      const win = ownerWindow(root.documentElement);
      // A distinct wrapper per install ensures a deferred cleanup cannot remove
      // a later binding through the DOM's listener-identity deduplication.
      const onCapture = (event: Event) => {
        if (!crossesBoundShadowRoot(event, root)) {
          listener(event);
        }
      };
      const onBubble = (event: Event) => {
        if (crossesBoundShadowRoot(event, root)) {
          listener(event);
        }
      };
      const offCapture = addEventListener(win, type, onCapture, {
        ...listenerOptions,
        capture: true,
      });
      const offBubble = addEventListener(win, type, onBubble, listenerOptions);
      return () => {
        offCapture();
        offBubble();
      };
    },
    shouldDefer,
    onDefer,
  });
}
