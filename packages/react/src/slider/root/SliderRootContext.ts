'use client';
import * as React from 'react';
import type { SliderRoot } from './SliderRoot';
import type { useSliderRoot } from './useSliderRoot';

export interface SliderRootContext extends Omit<useSliderRoot.ReturnValue, 'getRootProps'> {
  format?: Intl.NumberFormatOptions;
  state: SliderRoot.State;
  tabIndex: number | null;
}

export const SliderRootContext = React.createContext<SliderRootContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  SliderRootContext.displayName = 'SliderRootContext';
}

export function useSliderRootContext() {
  const context = React.useContext(SliderRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: SliderRootContext is missing. Slider parts must be placed within <Slider.Root>.',
    );
  }
  return context;
}
