'use client';
import * as React from 'react';
import type { UseFullscreenRootReturnValue } from './useFullscreenRoot';
import type { FullscreenRoot, FullscreenRootState } from './FullscreenRoot';

export interface FullscreenRootContext extends UseFullscreenRootReturnValue {
  onOpenChange: (open: boolean, eventDetails: FullscreenRoot.ChangeEventDetails) => void;
  state: FullscreenRootState;
}

export const FullscreenRootContext = React.createContext<FullscreenRootContext | undefined>(
  undefined,
);

export function useFullscreenRootContext() {
  const context = React.useContext(FullscreenRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: FullscreenRootContext is missing. Fullscreen parts must be placed within <Fullscreen.Root>.',
    );
  }

  return context;
}
