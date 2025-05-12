'use client';
import * as React from 'react';

const UNINITIALIZED = {};

/**
 * A React.useRef() that is initialized lazily with a function. Note that it accepts an optional
 * initialization argument, so the initialization function doesn't need to be an inline closure.
 *
 * @usage
 *   const ref = useLazyRef(sortColumns, columns)
 */
export function useLazyRef<T>(init: () => T): React.RefObject<T>;
export function useLazyRef<T, U>(init: (arg: U) => T, initArg: U): React.RefObject<T>;
export function useLazyRef(init: (arg?: unknown) => unknown, initArg?: unknown) {
  const ref = React.useRef(UNINITIALIZED as any);

  if (ref.current === UNINITIALIZED) {
    ref.current = init(initArg);
  }

  return ref;
}

/**
 * A React.useRef() that is initialized lazily with a function. The function gets direct access to
 * the ref object.
 *
 * SAFETY: The initialization function needs to initialize all ref fields.
 */
/* eslint-disable-next-line @typescript-eslint/naming-convention */
export function unsafe_useLazyDirectRef<T extends React.RefObject<any>>(
  init: (arg: React.RefObject<T>) => void,
): T {
  /* eslint-disable-next-line react-hooks/rules-of-hooks */
  const ref = React.useRef(UNINITIALIZED as any);

  if (ref.current === UNINITIALIZED) {
    init(ref as unknown as T);
  }

  return ref as unknown as T;
}
