/**
 * Cross-bundle shared state. Module singletons live on `globalThis`, so two
 * bundled copies of the engine share one registry, one lock counter, and so on.
 *
 * Each slot is a mutable object. Callers mutate its fields and never reassign
 * the slot, so the references other copies hold stay valid.
 */

// Every bundled copy finds the shared slots through this global symbol. Bump the
// version suffix when a release changes a slot's shape, so incompatible Base UI
// copies never read the same unchecked object as different internal types.
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
