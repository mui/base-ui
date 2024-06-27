'use client';
import * as React from 'react';
import type { HoverCardPositionerContextValue } from './HoverCardPositioner.types';

export const HoverCardPositionerContext =
  React.createContext<HoverCardPositionerContextValue | null>(null);

export function useHoverCardPositionerContext() {
  const context = React.useContext(HoverCardPositionerContext);
  if (context === null) {
    throw new Error(
      '<HoverCard.Popup> and <HoverCard.Arrow> must be used within the <HoverCard.Positioner> component',
    );
  }
  return context;
}
