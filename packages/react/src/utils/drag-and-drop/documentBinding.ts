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
  bind(root: DragEventRoot): void;
  unbind(root: DragEventRoot): void;
}

interface CreateDocumentBindingOptions {
  slot: string;
  install: (root: DragEventRoot) => DragCleanupFn;
  shouldDefer?: ((root: DragEventRoot) => boolean) | undefined;
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
  slot: string;
  shadowRootsSlot: string;
  type: string;
  listener: (event: Event) => void;
  options?: Omit<AddEventListenerOptions, 'capture'> | undefined;
  shouldDefer?: ((root: DragEventRoot) => boolean) | undefined;
  onDefer?: ((cleanup: DragCleanupFn) => void) | undefined;
}

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
