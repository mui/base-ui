'use client';
import * as React from 'react';
import { PreviewCardStore } from '../store/PreviewCardStore';

export type PreviewCardRootContext<Payload = unknown> = PreviewCardStore<Payload>;

export const PreviewCardRootContext = React.createContext<PreviewCardRootContext | undefined>(
  undefined,
);

export function usePreviewCardRootContext() {
  const context = React.useContext(PreviewCardRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: PreviewCardRootContext is missing. PreviewCard parts must be placed within <PreviewCard.Root>.',
    );
  }

  return context;
}
