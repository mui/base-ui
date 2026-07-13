export function NOOP() {}

// Intentionally not frozen. The `never[]` type documents that Base UI code must not
// mutate this singleton; we don't runtime-guard against userland mutation, and call
// sites were routinely casting it to narrower array types anyway.
export const EMPTY_ARRAY: never[] = [];

export const EMPTY_OBJECT = Object.freeze({});
