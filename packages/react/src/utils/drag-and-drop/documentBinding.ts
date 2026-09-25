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

export interface DocumentBinding {
  bind(root: DragEventRoot): void;
  unbind(root: DragEventRoot): void;
}

interface CreateDocumentBindingOptions {
  slot: string;
  install: (root: DragEventRoot) => DragCleanupFn;
}

export function createDocumentBinding(options: CreateDocumentBindingOptions): DocumentBinding {
  const { slot, install } = options;
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
        entry.cleanup();
      }
    },
  };
}

interface CreateEventRootBindingOptions {
  slot: string;
  shadowRootsSlot: string;
  type: string;
  listener: (event: Event) => void;
  options?: Omit<AddEventListenerOptions, 'capture'> | undefined;
}

export function createEventRootBinding(options: CreateEventRootBindingOptions): DocumentBinding {
  const { slot, shadowRootsSlot, type, listener, options: listenerOptions } = options;
  const boundShadowRoots = getSharedSlot<Set<ShadowRoot>>(
    shadowRootsSlot,
    () => new Set<ShadowRoot>(),
  );

  const crossesBoundShadowRoot = (event: Event, currentRoot: DragEventRoot): boolean => {
    // Both window wrappers below ask this for every event of `type` anywhere on
    // the page, for as long as one binding exists; `composedPath()` materializes
    // the whole ancestor chain, so don't build it unless a shadow root is bound.
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

  return createDocumentBinding({
    slot,
    install(root) {
      const shadowRoot = isShadowRoot(root);
      const target = shadowRoot ? root : ownerWindow(root.documentElement);
      if (shadowRoot) {
        boundShadowRoots.add(root);
      }
      // Use fresh wrappers so deferred cleanup cannot remove a later binding.
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
      const offCapture = addEventListener(target, type, onCapture, {
        ...listenerOptions,
        capture: true,
      });
      const offBubble = addEventListener(target, type, onBubble, listenerOptions);
      return () => {
        offCapture();
        offBubble();
        if (shadowRoot) {
          boundShadowRoots.delete(root);
        }
      };
    },
  });
}
