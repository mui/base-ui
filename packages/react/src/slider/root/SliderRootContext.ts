'use client';
import * as React from 'react';
import type { UseFieldValidationReturnValue } from '../../field/root/useFieldValidation';
import type { SliderStore } from '../store';
import type { SliderRoot, SliderRootState } from './SliderRoot';

export type SliderThumbCollisionBehavior = NonNullable<SliderRoot.Props['thumbCollisionBehavior']>;

/**
 * Root values consumed during render. Keep these outside `useSyncedValues` so descendant ref
 * callbacks see the current props during the same commit.
 */
export interface SliderRootPropsContextValue {
  disabled: boolean;
  state: SliderRootState;
  validation: UseFieldValidationReturnValue;
  format: Intl.NumberFormatOptions | undefined;
  inset: boolean;
  labelId: string | undefined;
  rootLabelId: string | undefined;
  largeStep: number;
  locale: Intl.LocalesArgument | undefined;
  form: string | undefined;
  name: string | undefined;
  renderBeforeHydration: boolean;
  thumbCollisionBehavior: SliderThumbCollisionBehavior;
}

export const SliderRootContext = React.createContext<SliderStore | undefined>(undefined);
export const SliderRootPropsContext = React.createContext<SliderRootPropsContextValue | undefined>(
  undefined,
);

export function useSliderRootContext() {
  const store = React.useContext(SliderRootContext);
  if (store === undefined) {
    throw new Error(
      'Base UI: SliderRootContext is missing. Slider parts must be placed within <Slider.Root>.',
    );
  }
  return store;
}

export function useSliderRootPropsContext() {
  const context = React.useContext(SliderRootPropsContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: SliderRootPropsContext is missing. Slider parts must be placed within <Slider.Root>.',
    );
  }
  return context;
}
