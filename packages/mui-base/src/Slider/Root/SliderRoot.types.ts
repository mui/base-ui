import { SliderThumbMetadata } from '../SliderThumb/SliderThumb.types';
import type { BaseUIComponentProps } from '../../utils/BaseUI.types';
import { CompoundComponentContextValue } from '../../useCompound';

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
  isRtl: boolean;
  max: number;
  min: number;
  /**
   * The component orientation.
   */
  orientation: 'horizontal' | 'vertical';
  step: number | null;
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
   * If `true`, the component is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * TODO: try to implement this in Material and remove from Base
   * If `true`, the active thumb doesn't swap when moving pointer over a thumb while dragging another thumb.
   * @default false
   */
  disableSwap?: boolean;
  /**
   * If `true` the Slider will be rendered right-to-left (with the lowest value on the right-hand side).
   * @default false
   */
  isRtl?: boolean;
  /**
   * Marks indicate predetermined values to which the user can move the slider.
   * If `true` the marks are spaced according the value of the `step` prop.
   * If an array, it should contain objects with `value` and an optional `label` keys.
   * @default false
   */
  marks?: boolean | ReadonlyArray<Mark>;
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
   * @param {React.SyntheticEvent | Event} event The event source of the callback. **Warning**: This is a generic event not a change event.
   */
  onValueCommitted?: (value: number | number[], event: React.SyntheticEvent | Event) => void;
  /**
   * The component orientation.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * The ref attached to the root of the Slider.
   */
  rootRef?: React.Ref<Element>;
  /**
   * A transformation function, to change the scale of the slider.
   * @param {any} x
   * @returns {any}
   * @default function Identity(x) {
   *   return x;
   * }
   */
  scale?: (value: number) => number;
  /**
   * The granularity with which the slider can step through values when using Page Up/Page Down or Shift + Arrow Up/Arrow Down.
   * @default 10
   */
  largeStep?: number;
  /**
   * The granularity with which the slider can step through values. (A "discrete" slider.)
   * The `min` prop serves as the origin for the valid values.
   * We recommend (max - min) to be evenly divisible by the step.
   *
   * When step is `null`, the thumb can only be slid onto marks provided with the `marks` prop.
   * @default 1
   */
  step?: number | null;
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

export type Axis = 'horizontal' | 'vertical' | 'horizontal-reverse';

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
  disabled: boolean;
  getFingerNewValue: (args: {
    finger: { x: number; y: number };
    move?: boolean;
    offset?: number;
    boundary?: Partial<DOMRect>;
  }) => { newValue: number | number[]; activeIndex: number; newValuePercent: number };
  handleValueChange: (
    value: number | number[],
    activeThumb: number,
    event: React.SyntheticEvent | Event,
  ) => void;
  isRtl: boolean;
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
  name?: string;
  onValueCommitted?: (value: number | number[], event: React.SyntheticEvent | Event) => void;
  /**
   * The thumb index for the current value when in hover state.
   */
  open: number;
  /**
   * The component orientation.
   * @default 'horizontal'
   */
  orientation: 'horizontal' | 'vertical';
  /**
   * The value(s) of the slider as percentages
   */
  percentageValues: readonly number[];
  scale: (value: number) => number;
  setActive: (activeIndex: number) => void;
  setDragging: (isDragging: boolean) => void;
  setOpen: (index: number) => void;
  setValueState: (newValue: number | number[]) => void;
  /**
   * The step value of the slider when incrementing or decrementing. It will snap
   * to multiples of this value. Decimal values are supported.
   * @default 1
   */
  step: number | null;
  subitems: Map<any, SliderThumbMetadata>;
  tabIndex?: number;
  /**
   * The value(s) of the slider
   */
  values: readonly number[];
}

export interface Mark {
  value: number;
  label?: React.ReactNode;
}
