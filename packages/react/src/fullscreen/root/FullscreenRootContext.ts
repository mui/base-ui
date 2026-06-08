'use client';
import * as React from 'react';
import type { UseFullscreenRootReturnValue } from './useFullscreenRoot';
import type { FullscreenStore } from '../store/FullscreenStore';

export interface FullscreenRootContext extends UseFullscreenRootReturnValue {
  store: FullscreenStore;
}

export const FullscreenRootContext = React.createContext<FullscreenRootContext | undefined>(
  undefined,
);

export function useFullscreenRootContext(optional: true): FullscreenRootContext | undefined;
export function useFullscreenRootContext(optional?: false): FullscreenRootContext;
export function useFullscreenRootContext(optional?: boolean) {
  const context = React.useContext(FullscreenRootContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: FullscreenRootContext is missing. Fullscreen parts must be placed within <Fullscreen.Root>, or provided with a handle.',
    );
  }

  return context;
}
