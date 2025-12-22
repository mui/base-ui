'use client';
import * as React from 'react';

/**
 * A wrapper around React.useContext that calls the underlying hook directly.
 */
export function useContext<T>(context: React.Context<T>): T {
  return React.useContext(context);
}
