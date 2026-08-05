export function NOOP() {}

// Kept mutable so its runtime behavior matches the mutable `never[]` type. The type prevents
// values from being added directly while remaining assignable to arrays with concrete element types.
export const EMPTY_ARRAY: never[] = [];

export const EMPTY_OBJECT = Object.freeze({});
