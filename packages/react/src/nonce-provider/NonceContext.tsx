'use client';
import * as React from 'react';

/**
 * @internal
 */
export const NonceContext = React.createContext<string | undefined>(undefined);

export function useNonce() {
  return React.useContext(NonceContext);
}
