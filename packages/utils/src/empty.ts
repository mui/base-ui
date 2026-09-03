export function NOOP() {}

// Typed as mutable `never[]` so it is assignable to any `T[]` fallback (for example
// `defaultValue ?? EMPTY_ARRAY` in `useControlled` callers) without widening `T`.
// Frozen so a write through a widened alias throws instead of mutating the shared singleton.
export const EMPTY_ARRAY: never[] = Object.freeze([]) as never[];

export const EMPTY_OBJECT = Object.freeze({});
