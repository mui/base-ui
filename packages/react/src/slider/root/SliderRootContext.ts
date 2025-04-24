'use client';
import * as React from 'react';
import type { Orientation } from '../../utils/types';
import { type CompositeMetadata } from '../../composite/list/CompositeList';
import type { ThumbMetadata } from '../thumb/SliderThumb';
import type { SliderRoot } from './SliderRoot';

export interface SliderRootContext {
  /**
   * The index of the active thumb.
   */
  active: number;
  dragging: boolean;
  disabled: boolean;
  format?: Intl.NumberFormatOptions;
  handleInputChange: (
    valueInput: number,
    index: number,
    event: React.KeyboardEvent | React.ChangeEvent,
  ) => void;
  labelId?: string;
  /**
   * The large step value of the slider when incrementing or decrementing while the shift key is held,
   * or when using Page-Up or Page-Down keys. Snaps to multiples of this value.
   * @default 10
   */
  largeStep: number;
  lastChangedValueRef: React.RefObject<number | readonly number[] | null>;
  /**
   * The maximum allowed value of the slider.
   */
  max: number;
  /**
   * The minimum allowed value of the slider.
   */
  min: number;
  /**
   * The minimum steps between values in a range slider.
   */
  minStepsBetweenValues: number;
  name: string;
  /**
   * Function to be called when drag ends and the pointer is released.
   */
  onValueCommitted: (newValue: number | readonly number[], event: Event) => void;
  /**
   * The component orientation.
   * @default 'horizontal'
   */
  orientation: Orientation;
  /**
   * Whether the slider is a range slider.
   */
  range: boolean;
  registerInputValidationRef: (element: HTMLElement | null) => void;
  setActive: React.Dispatch<React.SetStateAction<number>>;
  setDragging: React.Dispatch<React.SetStateAction<boolean>>;
  /**
   * Callback fired when dragging and invokes onValueChange.
   */
  setValue: (newValue: number | number[], activeThumb: number, event: Event) => void;
  state: SliderRoot.State;
  /**
   * The step increment of the slider when incrementing or decrementing. It will snap
   * to multiples of this value. Decimal values are supported.
   * @default 1
   */
  step: number;
  tabIndex: number | null;
  thumbMap: Map<Node, CompositeMetadata<ThumbMetadata> | null>;
  thumbRefs: React.RefObject<(HTMLElement | null)[]>;
  /**
   * The value(s) of the slider
   */
  values: readonly number[];
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
