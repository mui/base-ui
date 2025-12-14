'use client';
import * as React from 'react';

/**
 * A wrapper around React.useState that calls the underlying hook directly.
 */
export function useState<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>];
export function useState<S = undefined>(): [S | undefined, React.Dispatch<React.SetStateAction<S | undefined>>];
export function useState<S>(initialState?: S | (() => S)) {
  return React.useState(initialState);
}
