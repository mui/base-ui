'use client';
import * as React from 'react';
import type { PopupPositioning } from '../../utils/popups/popupPositioner';

export type PreviewCardPositionerContext = Pick<
  PopupPositioning,
  'side' | 'align' | 'arrowRef' | 'arrowUncentered' | 'arrowStyles' | 'instant'
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
