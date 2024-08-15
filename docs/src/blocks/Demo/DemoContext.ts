'use client';

import * as React from 'react';
import { DemoFile, DemoVariant } from './types';

export type CodeDisplay = 'collapsed' | 'expanded' | 'preview';

export interface DemoState {
  selectedVariant: DemoVariant;
  selectedFile: DemoFile;
  codeDisplay: CodeDisplay;
}

export interface DemoContext {
  variants: DemoVariant[];
  state: DemoState;
  setCodeDisplay: (codeDisplay: CodeDisplay) => void;
  selectVariant: (variant: DemoVariant) => void;
  selectFile: (file: DemoFile) => void;
  copySource: () => void;
  reset: () => void;
  resetFocus: () => void;
}

const DemoContext = React.createContext<DemoContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  DemoContext.displayName = 'DemoContext';
}

export { DemoContext };
