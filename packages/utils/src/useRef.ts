'use client';
import * as React from 'react';

/**
 * A wrapper around `React.useRef` that forwards calls directly to React's implementation.
 * This wrapper is used internally by Base UI components to provide a consistent hook interface.
 */
export const useRef: typeof React.useRef = React.useRef;
