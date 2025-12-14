'use client';
import * as React from 'react';

/**
 * A wrapper around React.useRef that calls the underlying hook directly.
 */
export function useRef<T>(initialValue: T): React.MutableRefObject<T>;
export function useRef<T>(initialValue: T | null): React.RefObject<T>;
export function useRef<T = undefined>(): React.MutableRefObject<T | undefined>;
export function useRef<T>(initialValue?: T): React.MutableRefObject<T | undefined> {
  return React.useRef(initialValue);
}
