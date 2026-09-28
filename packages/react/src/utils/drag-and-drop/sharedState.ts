/**
 * Cross-bundle shared state. Routes module singletons through `globalThis`
 * so a doubly-bundled engine still sees a single registry, lock counter, etc.
 *
 * Each slot is a mutable object — callers mutate fields rather than reassign
 * the slot, so other copies' references remain valid.
 */

// The global symbol is the cross-bundle protocol boundary. Bump the suffix when
// a release changes the slot contracts so incompatible Base UI copies never cast
// the same unchecked objects to different internal shapes.
const ROOT_KEY = Symbol.for('@base-ui/react/drag-and-drop/v1');

export function getSharedSlot<T extends object>(name: string, factory: () => T): T {
  const root = globalThis as { [ROOT_KEY]?: Map<string, object> | undefined };
  root[ROOT_KEY] ??= new Map();
  const slots = root[ROOT_KEY];
  let slot = slots.get(name) as T | undefined;
  if (!slot) {
    slot = factory();
    slots.set(name, slot);
  }
  return slot;
}
