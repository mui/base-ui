import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { ownerWindow } from '@base-ui/utils/owner';
import { isShadowRoot } from '@floating-ui/utils/dom';
import { getSharedSlot } from './sharedState';
import type { DragCleanupFn } from './types';
import { getOrCreate, onceCleanup } from './utils';

export type DragEventRoot = Document | ShadowRoot;

interface DocumentBindingEntry {
  count: number;
  cleanup: DragCleanupFn;
}

interface DocumentBinding {
  bind(root: DragEventRoot): DragCleanupFn;
}

interface CreateEventRootBindingOptions {
  slot: string;
  listeners: Record<string, (event: Event) => void>;
}

export function createEventRootBinding(options: CreateEventRootBindingOptions): DocumentBinding {
  const { slot, listeners } = options;
  const bindings = getSharedSlot<WeakMap<DragEventRoot, DocumentBindingEntry>>(
    slot,
    () => new WeakMap<DragEventRoot, DocumentBindingEntry>(),
  );
  const boundShadowRoots = getSharedSlot<Map<EventTarget, ShadowRoot>>(
    `${slot}.shadowRootsByHost`,
    () => new Map<EventTarget, ShadowRoot>(),
  );
  /**
   * An event from inside a bound shadow root reaches that root's capture wrapper and
   * then the bubble fallback of every bound root above it, so deliver it only once.
   */
  const delivered = getSharedSlot<WeakSet<Event>>(`${slot}.delivered`, () => new WeakSet<Event>());

  const deliver = (event: Event) => {
    if (!delivered.has(event)) {
      delivered.add(event);
      listeners[event.type](event);
    }
  };

  const crossesBoundShadowRoot = (event: Event, currentRoot: DragEventRoot): boolean => {
    // The window wrappers call this for every bound-type event on the page, and
    // `composedPath()` builds the whole ancestor chain, so skip it when possible.
    if (boundShadowRoots.size === 0) {
      return false;
    }
    const path = event.composedPath();
    const end = isShadowRoot(currentRoot) ? path.indexOf(currentRoot) : path.length;
    for (let i = 0; i < end; i += 1) {
      const root = boundShadowRoots.get(path[i]);
      if (root && root !== currentRoot) {
        return true;
      }
    }
    return false;
  };

  const install = (root: DragEventRoot): DragCleanupFn => {
    const shadowRoot = isShadowRoot(root);
    const target = shadowRoot ? root : ownerWindow(root.documentElement);
    if (shadowRoot) {
      boundShadowRoots.set(root.host, root);
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
    return mergeCleanups(...offs, shadowRoot && (() => boundShadowRoots.delete(root.host)));
  };

  function unbind(root: DragEventRoot): void {
    const entry = bindings.get(root);
    if (!entry) {
      return;
    }
    entry.count -= 1;
    if (entry.count === 0) {
      bindings.delete(root);
      entry.cleanup();
    }
  }

  return {
    bind(root: DragEventRoot): DragCleanupFn {
      getOrCreate(bindings, root, () => ({ count: 0, cleanup: install(root) })).count += 1;
      return onceCleanup(() => unbind(root));
    },
  };
}
