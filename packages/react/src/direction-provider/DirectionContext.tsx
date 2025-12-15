'use client';
import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export type TextDirection = 'ltr' | 'rtl';

export type DirectionContext = {
  direction: TextDirection;
};

/**
 * @internal
 */
export const DirectionContext = React.createContext<DirectionContext | undefined>(undefined);

export function useDirection() {
  const context = useContext(DirectionContext);

  return context?.direction ?? 'ltr';
}
