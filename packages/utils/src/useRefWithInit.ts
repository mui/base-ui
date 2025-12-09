'use client';
import * as React from 'react';

const UNINITIALIZED = {};

/**
 * A React.useRef() that is initialized with a function. Note that it accepts an optional
 * initialization argument, so the initialization function doesn't need to be an inline closure.
 *
 * @usage
 *   const ref = useRefWithInit(sortColumns, columns)
 */
export function useRefWithInit<T>(init: () => T): React.RefObject<T>;
export function useRefWithInit<T, U>(init: (a1: U) => T, a1: U): React.RefObject<T>;
export function useRefWithInit<T, U, V>(
  init: (a1: U, a2: V) => T,
  a1: U,
  a2: V,
): React.RefObject<T>;
export function useRefWithInit<T, U, V, W>(
  init: (a1: U, a2: V, a3: W) => T,
  a1: U,
  a2: V,
  a3: W,
): React.RefObject<T>;
export function useRefWithInit(
  init: (a1?: unknown, a2?: unknown, a3?: unknown) => unknown,
  a1?: unknown,
  a2?: unknown,
  a3?: unknown,
) {
  const ref = React.useRef(UNINITIALIZED as any);

  if (ref.current === UNINITIALIZED) {
    ref.current = init(a1, a2, a3);
  }

  return ref;
}
