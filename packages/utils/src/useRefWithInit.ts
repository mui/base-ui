'use client';
import { useRef } from './useRef';

const UNINITIALIZED = {};

/**
 * A useRef() that is initialized with a function. Note that it accepts an optional
 * initialization argument, so the initialization function doesn't need to be an inline closure.
 *
 * @usage
 *   const ref = useRefWithInit(sortColumns, columns)
 */
export function useRefWithInit<T>(init: () => T): React.RefObject<T>;
export function useRefWithInit<T, U>(init: (arg: U) => T, initArg: U): React.RefObject<T>;
export function useRefWithInit(init: (arg?: unknown) => unknown, initArg?: unknown) {
  // Note: We use React.useRef directly here to avoid circular dependencies
  // since fastHooks.ts depends on useRefWithInit
  const ref = useRef(UNINITIALIZED as any);

  if (ref.current === UNINITIALIZED) {
    ref.current = init(initArg);
  }

  return ref;
}
