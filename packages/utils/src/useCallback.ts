'use client';
import * as React from 'react';

/**
 * A wrapper around `React.useCallback` that forwards calls directly to React's implementation.
 * This wrapper is used internally by Base UI components to provide a consistent hook interface.
 */
export const useCallback: typeof React.useCallback = React.useCallback;
