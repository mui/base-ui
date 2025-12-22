'use client';
import * as React from 'react';

/**
 * A wrapper around React.useDebugValue that calls the underlying hook directly.
 */
export function useDebugValue<T>(value: T, format?: (value: T) => any): void {
  React.useDebugValue(value, format);
}
