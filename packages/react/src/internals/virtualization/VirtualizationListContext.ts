'use client';
import * as React from 'react';

export const VirtualizationListContext = React.createContext(false);

export function useVirtualizationListContext() {
  return React.useContext(VirtualizationListContext);
}
