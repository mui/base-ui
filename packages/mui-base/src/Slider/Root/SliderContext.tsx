'use client';
import * as React from 'react';
import { SliderContextValue } from './SliderRoot.types';

export const SliderContext = React.createContext<SliderContextValue | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  SliderContext.displayName = 'SliderContext';
}

export function useSliderContext() {
  const context = React.useContext(SliderContext);
  if (context === undefined) {
    throw new Error('useSliderContext must be used inside a Slider component');
  }
  return context;
}
