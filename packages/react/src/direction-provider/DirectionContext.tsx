'use client';
import * as React from 'react';

export type TextDirection = 'ltr' | 'rtl';

export type DirectionContext = {
  direction: TextDirection;
};

/**
 * @ignore - internal component.
 */
export const DirectionContext = React.createContext<DirectionContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  DirectionContext.displayName = 'DirectionContext';
}

export function useDirectionContext(optional = true) {
  const context = React.useContext(DirectionContext);
  if (context === undefined && !optional) {
    throw new Error('Base UI: DirectionContext is missing.');
  }

  return context;
}
