/**
 * Cross-bundle shared state. Module singletons live on `globalThis`, so two bundled
 * copies of the engine share them. Callers mutate a slot's fields and never reassign
 * the slot, so references held by other copies stay valid.
 */

// Bump the version suffix when a release changes a slot's shape, so incompatible
// Base UI copies never share a slot.
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
