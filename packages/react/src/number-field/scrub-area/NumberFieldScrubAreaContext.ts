import * as React from 'react';
import { useScrub } from './useScrub';

export interface NumberFieldScrubAreaContext extends ReturnType<typeof useScrub> {
  direction: 'horizontal' | 'vertical';
  pixelSensitivity: number;
  teleportDistance: number | undefined;
}

export const NumberFieldScrubAreaContext = React.createContext<
  ReturnType<typeof useScrub> | undefined
>(undefined);

if (process.env.NODE_ENV !== 'production') {
  NumberFieldScrubAreaContext.displayName = 'NumberFieldScrubAreaContext';
}

export function useNumberFieldScrubAreaContext() {
  const context = React.useContext(NumberFieldScrubAreaContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: NumberFieldScrubAreaContext is missing. NumberFieldScrubArea parts must be placed within <NumberField.ScrubArea>.',
    );
  }
  return context;
}
