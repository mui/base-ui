import { addEventListener } from '@base-ui/utils/addEventListener';
import { ownerWindow } from '@base-ui/utils/owner';
import { isShadowRoot } from '@floating-ui/utils/dom';
import { getSharedSlot } from './sharedState';
import type { DragCleanupFn } from './types';

export type DragEventRoot = Document | ShadowRoot;

interface DocumentBindingEntry {
  count: number;
  cleanup: DragCleanupFn;
}

interface DocumentBinding {
  bind(root: DragEventRoot): void;
  unbind(root: DragEventRoot): void;
}

interface CreateEventRootBindingOptions {
  slot: string;
  /** The listener for each event type, keyed by type. */
  listeners: Record<string, (event: Event) => void>;
}

export function createEventRootBinding(options: CreateEventRootBindingOptions): DocumentBinding {
  const { slot, listeners } = options;
  const bindings = getSharedSlot<WeakMap<DragEventRoot, DocumentBindingEntry>>(
    slot,
    () => new WeakMap<DragEventRoot, DocumentBindingEntry>(),
  );
  const boundShadowRoots = getSharedSlot<Set<ShadowRoot>>(
    `${slot}.shadowRoots`,
    () => new Set<ShadowRoot>(),
  );
  /**
   * Events already delivered. An event from inside a bound shadow root reaches
   * that root's capture wrapper and then the bubble fallback of every bound root
   * above it, so it must be delivered only once.
   */
  const delivered = getSharedSlot<WeakSet<Event>>(`${slot}.delivered`, () => new WeakSet<Event>());

  const deliver = (event: Event) => {
    if (!delivered.has(event)) {
      delivered.add(event);
      listeners[event.type](event);
    }
  };

  const crossesBoundShadowRoot = (event: Event, currentRoot: DragEventRoot): boolean => {
    // The window wrappers below call this for every event of a bound type on the
    // page while any binding exists. `composedPath()` builds the whole ancestor
    // chain, so skip it when no shadow root is bound.
    if (boundShadowRoots.size === 0) {
      return false;
    }
    const path = event.composedPath();
    for (const root of boundShadowRoots.keys()) {
      if (
        root !== currentRoot &&
        path.includes(root.host) &&
        (!isShadowRoot(currentRoot) || path.indexOf(root.host) < path.indexOf(currentRoot))
      ) {
        return true;
      }
    }
    return false;
  };

  const install = (root: DragEventRoot): DragCleanupFn => {
    const shadowRoot = isShadowRoot(root);
    const target = shadowRoot ? root : ownerWindow(root.documentElement);
    if (shadowRoot) {
      boundShadowRoots.add(root);
    }
    // Use fresh wrappers so deferred cleanup cannot remove a later binding.
    const onCapture = (event: Event) => {
      if (!crossesBoundShadowRoot(event, root)) {
        deliver(event);
      }
    };
    const onBubble = (event: Event) => {
      if (crossesBoundShadowRoot(event, root)) {
        deliver(event);
      }
    };
    const offs = Object.keys(listeners).flatMap((type) => [
      addEventListener(target, type, onCapture, { capture: true }),
      addEventListener(target, type, onBubble),
    ]);
    return () => {
      for (const off of offs) {
        off();
      }
      if (shadowRoot) {
        boundShadowRoots.delete(root);
      }
    };
  };

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
        entry.cleanup();
      }
    },
  };
}
