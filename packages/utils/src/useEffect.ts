'use client';
import * as React from 'react';

/**
 * A wrapper around `React.useEffect` that forwards calls directly to React's implementation.
 * This wrapper is used internally by Base UI components to provide a consistent hook interface.
 */
export const useEffect: typeof React.useEffect = React.useEffect;
