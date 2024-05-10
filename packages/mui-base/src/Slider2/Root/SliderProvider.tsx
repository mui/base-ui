'use client';
import * as React from 'react';
import { CompoundComponentContext, CompoundComponentContextValue } from '../../useCompound';
import { SliderThumbMetadata } from '../SliderThumb/SliderThumb.types';
import { SliderContext, type SliderContextValue } from './SliderContext';

export type SliderProviderValue = SliderContextValue & {
  compoundComponentContextValue: CompoundComponentContextValue<any, SliderThumbMetadata>;
};

export interface SliderProviderProps {
  value: SliderProviderValue;
  children: React.ReactNode;
}

/**
 * Sets up contexts for the Slider and its subcomponents.
 *
 * @ignore - do not document.
 */
function SliderProvider(props: SliderProviderProps) {
  const { value: valueProp, children } = props;

  const { compoundComponentContextValue, ...contextValue } = valueProp;

  return (
    <CompoundComponentContext.Provider value={compoundComponentContextValue}>
      <SliderContext.Provider value={contextValue}>{children}</SliderContext.Provider>
    </CompoundComponentContext.Provider>
  );
}

export { SliderProvider };
