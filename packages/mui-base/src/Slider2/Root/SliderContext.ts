import * as React from 'react';
import { UseSliderReturnValue, SliderRootOwnerState } from './SliderRoot.types';

export type SliderContextValue = Omit<
  UseSliderReturnValue,
  'compoundComponentContextValue' | 'getRootProps'
> & {
  ownerState: SliderRootOwnerState;
};

export const SliderContext = React.createContext<SliderContextValue | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  SliderContext.displayName = 'SliderContext';
}

export function useSliderContext(part: string) {
  const context = React.useContext(SliderContext);
  if (context === undefined) {
    throw new Error(`Base UI: Slider${part} is not placed inside the Slider component.`);
  }
  return context;
}
