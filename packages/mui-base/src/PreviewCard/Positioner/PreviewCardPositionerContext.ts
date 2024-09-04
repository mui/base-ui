'use client';

import * as React from 'react';
import type { PreviewCardPositionerContextValue } from './PreviewCardPositioner.types';

export const PreviewCardPositionerContext =
  React.createContext<PreviewCardPositionerContextValue | null>(null);

export function usePreviewCardPositionerContext() {
  const context = React.useContext(PreviewCardPositionerContext);
  if (context === null) {
    throw new Error(
      '<PreviewCard.Popup> and <PreviewCard.Arrow> must be used within the <PreviewCard.Positioner> component',
    );
  }
  return context;
}
