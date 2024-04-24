import * as React from 'react';
import { UseSliderReturnValue } from '../useSlider2/useSlider.types';
import { SliderOwnerState } from './Slider.types';

export type SliderContextValue = Omit<UseSliderReturnValue, 'compoundComponentContextValue'> & {
  ownerState: SliderOwnerState;
};

export const SliderContext = React.createContext<SliderContextValue | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  SliderContext.displayName = 'SliderContext';
}

type Part = 'Track' | 'Thumb';

export function useSliderContext(part: Part) {
  const context = React.useContext(SliderContext);
  if (context === undefined) {
    throw new Error(`Base UI: Slider${part} is not placed inside the Slider component.`);
  }
  return context;
}
