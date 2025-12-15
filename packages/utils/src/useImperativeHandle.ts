'use client';
import * as React from 'react';

/**
 * A wrapper around React.useImperativeHandle that calls the underlying hook directly.
 */
export function useImperativeHandle<T, R extends T>(
  ref: React.Ref<T> | undefined,
  init: () => R,
  deps?: React.DependencyList,
): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- This is a pass-through wrapper
  React.useImperativeHandle(ref, init, deps);
}
