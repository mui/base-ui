import type { BaseUIComponentProps } from '../../utils/types';
import { CompoundComponentContextValue } from '../../useCompound';

export interface SliderThumbMetadata {
  inputId: string;
  ref: React.RefObject<HTMLElement>;
  inputRef: React.RefObject<HTMLInputElement>;
}

export type SliderContextValue = Omit<
  UseSliderReturnValue,
  'compoundComponentContextValue' | 'getRootProps'
> & {
  ownerState: SliderRootOwnerState;
};

export type SliderProviderValue = SliderContextValue & {
  compoundComponentContextValue: CompoundComponentContextValue<any, SliderThumbMetadata>;
};

export type SliderDirection = 'ltr' | 'rtl';

export type SliderOrientation = 'horizontal' | 'vertical';

export interface SliderRootOwnerState {
  /**
   * The index of the active thumb.
   */
  activeThumbIndex: number;
  /**
   * If `true`, the component is disabled.
   */
  disabled: boolean;
  /**
   * If `true`, a thumb is being dragged by a pointer.
   */
  dragging: boolean;
  direction: SliderDirection;
  max: number;
  min: number;
  /**
   * The minimum steps between values in a range slider.
   * @default 0
   */
  minStepsBetweenValues: number;
  /**
   * The component orientation.
   */
  orientation: SliderOrientation;
  /**
   * The step increment of the slider when incrementing or decrementing. It will snap
   * to multiples of this value. Decimal values are supported.
   * @default 1
   */
  step: number;
  /**
   * The raw number value of the slider.
   */
  values: ReadonlyArray<number>;
}

export interface SliderRootProps
  extends Omit<UseSliderParameters, 'rootRef'>,
    Omit<
      BaseUIComponentProps<'span', SliderRootOwnerState>,
      'defaultValue' | 'onChange' | 'values'
    > {
  /**
   * The default value of the slider. Use when the component is not controlled.
   */
  defaultValue?: number | ReadonlyArray<number>;
  /**
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * The value of the slider.
   * For ranged sliders, provide an array with two values.
   */
  value?: number | ReadonlyArray<number>;
}

export interface UseSliderParameters {
  /**
   * The id of the element containing a label for the slider.
   */
  'aria-labelledby'?: string;
  /**
   * The default value. Use when the component is not controlled.
   */
  defaultValue?: number | ReadonlyArray<number>;
  /**
   * Sets the direction. For right-to-left languages, the lowest value is on the right-hand side.
   * @default 'ltr'
   */
  direction?: SliderDirection;
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * The maximum allowed value of the slider.
   * Should not be equal to min.
   * @default 100
   */
  max?: number;
  /**
   * The minimum allowed value of the slider.
   * Should not be equal to max.
   * @default 0
   */
  min?: number;
  /**
   * The minimum steps between values in a range slider.
   * @default 0
   */
  minStepsBetweenValues?: number;
  /**
   * Name attribute of the hidden `input` element.
   */
  name?: string;
  /**
   * Callback function that is fired when the slider's value changed.
   *
   * @param {number | number[]} value The new value.
   * @param {number} activeThumb Index of the currently moved thumb.
   * @param {Event} event The event source of the callback.
   * You can pull out the new value by accessing `event.target.value` (any).
   * **Warning**: This is a generic event not a change event.
   */
  onValueChange?: (value: number | number[], activeThumb: number, event: Event) => void;
  /**
   * Callback function that is fired when the `pointerup` is triggered.
   *
   * @param {number | number[]} value The new value.
   * @param {Event} event The event source of the callback.
   * **Warning**: This is a generic event not a change event.
   */
  onValueCommitted?: (value: number | number[], event: Event) => void;
  /**
   * The component orientation.
   * @default 'horizontal'
   */
  orientation?: SliderOrientation;
  /**
   * The ref attached to the root of the Slider.
   */
  rootRef?: React.Ref<Element>;
  /**
   * The granularity with which the slider can step through values when using Page Up/Page Down or Shift + Arrow Up/Arrow Down.
   * @default 10
   */
  largeStep?: number;
  /**
   * The granularity with which the slider can step through values. (A "discrete" slider.)
   * The `min` prop serves as the origin for the valid values.
   * We recommend (max - min) to be evenly divisible by the step.
   * @default 1
   */
  step?: number;
  /**
   * Tab index attribute of the Thumb component's `input` element.
   */
  tabIndex?: number;
  /**
   * The value of the slider.
   * For ranged sliders, provide an array with two values.
   */
  value?: number | ReadonlyArray<number>;
}

export type Axis = SliderOrientation | 'horizontal-reverse';

export interface AxisProps<T extends Axis> {
  offset: (
    percent: number,
  ) => T extends 'horizontal'
    ? { left: string }
    : T extends 'vertical'
      ? { bottom: string }
      : T extends 'horizontal-reverse'
        ? { right: string }
        : never;
  leap: (
    percent: number,
  ) => T extends 'horizontal' | 'horizontal-reverse'
    ? { width: string }
    : T extends 'vertical'
      ? { height: string }
      : never;
}

export interface UseSliderReturnValue {
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'span'>,
  ) => React.ComponentPropsWithRef<'span'>;
  /**
   * The index of the active thumb.
   */
  active: number;
  /**
   * A function that compares a new value with the internal value of the slider.
   * The internal value is potentially unsorted, e.g. to support frozen arrays: https://github.com/mui/material-ui/pull/28472
   */
  areValuesEqual: (newValue: number | ReadonlyArray<number>) => boolean;
  'aria-labelledby'?: string;
  /**
   * The orientation of the slider.
   */
  axis: Axis;
  changeValue: (
    valueInput: number,
    index: number,
    event: React.KeyboardEvent | React.ChangeEvent,
  ) => void;
  compoundComponentContextValue: CompoundComponentContextValue<any, SliderThumbMetadata>;
  dragging: boolean;
  direction: SliderDirection;
  disabled: boolean;
  getFingerNewValue: (args: {
    finger: { x: number; y: number };
    move?: boolean;
    offset?: number;
    activeIndex?: number;
  }) => { newValue: number | number[]; activeIndex: number; newPercentageValue: number } | null;
  handleValueChange: (
    value: number | number[],
    activeThumb: number,
    event: React.SyntheticEvent | Event,
  ) => void;
  /**
   * The large step value of the slider when incrementing or decrementing while the shift key is held,
   * or when using Page-Up or Page-Down keys. Snaps to multiples of this value.
   * @default 10
   */
  largeStep: number;
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
  name?: string;
  onValueCommitted?: (value: number | number[], event: Event) => void;
  /**
   * The component orientation.
   * @default 'horizontal'
   */
  orientation: SliderOrientation;
  registerSliderControl: (element: HTMLElement | null) => void;
  /**
   * The value(s) of the slider as percentages
   */
  percentageValues: readonly number[];
  setActive: (activeIndex: number) => void;
  setDragging: (isDragging: boolean) => void;
  setValueState: (newValue: number | number[]) => void;
  /**
   * The step increment of the slider when incrementing or decrementing. It will snap
   * to multiples of this value. Decimal values are supported.
   * @default 1
   */
  step: number;
  /**
   * A map containing all the Thumb components registered to the slider
   */
  subitems: Map<string, SliderThumbMetadata>;
  tabIndex?: number;
  /**
   * The value(s) of the slider
   */
  values: readonly number[];
}
