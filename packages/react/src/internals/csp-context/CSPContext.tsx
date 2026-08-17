'use client';
import * as React from 'react';

export interface CSPContextValue {
  nonce?: string | undefined;
  disableStyleElements?: boolean | undefined;
}

export const CSPContext = React.createContext<CSPContextValue | undefined>(undefined);

const DEFAULT_CSP_CONTEXT_VALUE: CSPContextValue = {
  disableStyleElements: false,
};

export function useCSPContext(): CSPContextValue {
  return React.useContext(CSPContext) ?? DEFAULT_CSP_CONTEXT_VALUE;
}
