'use client';
import * as React from 'react';
import { getTextDirection } from './getTextDirection';
import { useEnhancedEffect } from './useEnhancedEffect';

/**
 * Detect the inherited CSS `direction` if a `dir` param is not provided
 * @ignore - internal
 */
export function useDir(dirParam: string | undefined, element: HTMLElement | null) {
  const [autoDir, setAutoDir] = React.useState(dirParam);

  useEnhancedEffect(() => {
    if (dirParam === undefined && element) {
      setAutoDir(getTextDirection(element));
    }
  }, [dirParam, element]);

  return dirParam ?? autoDir;
}
