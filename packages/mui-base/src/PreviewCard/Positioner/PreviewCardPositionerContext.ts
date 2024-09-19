'use client';
import * as React from 'react';
import type { Side, Alignment } from '../../utils/useAnchorPositioning';

export interface PreviewCardPositionerContext {
  side: Side;
  alignment: Alignment;
  arrowRef: React.MutableRefObject<Element | null>;
  arrowUncentered: boolean;
  arrowStyles: React.CSSProperties;
}

export const PreviewCardPositionerContext =
  React.createContext<PreviewCardPositionerContext | null>(null);

export function usePreviewCardPositionerContext() {
  const context = React.useContext(PreviewCardPositionerContext);
  if (context === null) {
    throw new Error(
      'Base UI: <PreviewCard.Popup> and <PreviewCard.Arrow> must be used within the <PreviewCard.Positioner> component',
    );
  }
  return context;
}
