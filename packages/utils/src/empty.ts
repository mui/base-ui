export function NOOP(): void {}

// Frozen so a write through a widened alias throws instead of mutating the shared singleton.
export const EMPTY_ARRAY: readonly never[] = Object.freeze([]);

export const EMPTY_OBJECT: Readonly<{}> = Object.freeze({});
