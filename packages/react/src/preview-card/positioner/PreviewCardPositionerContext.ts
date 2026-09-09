'use client';
import * as React from 'react';
import type { UseAnchorPositioningReturnValue } from '../../internals/useAnchorPositioning';

export type PreviewCardPositionerContext = Pick<
  UseAnchorPositioningReturnValue,
  'side' | 'align' | 'arrowRef' | 'arrowUncentered' | 'arrowStyles'
>;

export const PreviewCardPositionerContext = React.createContext<
  PreviewCardPositionerContext | undefined
>(undefined);

export function usePreviewCardPositionerContext() {
  const context = React.useContext(PreviewCardPositionerContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: PreviewCardPositionerContext is missing. PreviewCardPositioner parts must be placed within <PreviewCard.Positioner>.',
    );
  }

  return context;
}
