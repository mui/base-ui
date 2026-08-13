/**
 * Cross-bundle shared state. Routes module singletons through `globalThis`
 * so a doubly-bundled engine still sees a single registry, lock counter, etc.
 *
 * Each slot is a mutable object — callers mutate fields rather than reassign
 * the slot, so other copies' references remain valid.
 */

const ROOT_KEY = Symbol.for('@base-ui/react/drag-and-drop');

interface Root {
  slots: Map<string, unknown>;
}

function getRoot(): Root {
  const g = globalThis as { [ROOT_KEY]?: Root | undefined };
  const existing = g[ROOT_KEY];
  if (existing) {
    return existing;
  }
  const fresh: Root = { slots: new Map() };
  g[ROOT_KEY] = fresh;
  return fresh;
}

export function getSharedSlot<T extends object>(name: string, factory: () => T): T {
  const root = getRoot();
  let slot = root.slots.get(name) as T | undefined;
  if (!slot) {
    slot = factory();
    root.slots.set(name, slot);
  }
  return slot;
}
