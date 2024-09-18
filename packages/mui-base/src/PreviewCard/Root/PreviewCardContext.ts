'use client';
import * as React from 'react';
import type { PreviewCardRootContextValue } from './PreviewCardRoot.types';

export const PreviewCardRootContext = React.createContext<PreviewCardRootContextValue | null>(null);

export function usePreviewCardRootContext() {
  const context = React.useContext(PreviewCardRootContext);
  if (context === null) {
    throw new Error('PreviewCard components must be used within the <PreviewCard.Root> component');
  }
  return context;
}
