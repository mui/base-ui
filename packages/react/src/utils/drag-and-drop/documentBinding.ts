/**
 * Ref-counted per-event-root listener binding, shared by the pointer and
 * keyboard sensors. Each sensor installs one listener pair per owner document
 * or shadow root and ref-counts it by the number of draggables registered there.
 *
 * The counter lives in a `getSharedSlot` map so a doubly-bundled engine still
 * shares one count per root, exactly like the sensors' other shared state.
 */

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
