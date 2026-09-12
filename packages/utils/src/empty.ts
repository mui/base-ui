export function NOOP() {}

// Typed as `readonly never[]` so it is assignable to `readonly T[]` inputs
// (for example `defaultValue ?? EMPTY_ARRAY` in `useControlled` callers) without widening `T`.
// Frozen so a write through a widened alias throws instead of mutating the shared singleton.
export const EMPTY_ARRAY: readonly never[] = Object.freeze([]) as readonly never[];

export const EMPTY_OBJECT = Object.freeze({});
