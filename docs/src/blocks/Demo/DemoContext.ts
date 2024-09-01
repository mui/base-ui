'use client';

import * as React from 'react';
import { DemoFile, DemoVariant } from './types';

export interface DemoContext {
  selectedFile: DemoFile;
  selectedVariant: DemoVariant;
  selectFile: (file: DemoFile) => void;
  selectVariant: (variant: DemoVariant) => void;
  variants: DemoVariant[];
}

const DemoContext = React.createContext<DemoContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  DemoContext.displayName = 'DemoContext';
}

export { DemoContext };

export function useDemoContext() {
  const context = React.useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoContext must be used within a DemoProvider');
  }
  return context;
}
