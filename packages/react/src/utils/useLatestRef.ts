'use client';
import * as React from 'react';
import { useEnhancedEffect } from './useEnhancedEffect';

export function useLatestRef<T>(value: T) {
  const ref = React.useRef(value);
  useEnhancedEffect(() => {
    ref.current = value;
  });
  return ref;
}
