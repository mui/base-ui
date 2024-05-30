import { BaseUIComponentProps } from '../../utils/BaseUI.types';
import { SliderRootOwnerState, UseSliderReturnValue } from '../Root/SliderRoot.types';

export interface SliderThumbOwnerState extends SliderRootOwnerState {}

export interface SliderThumbProps
  extends Partial<Omit<UseSliderThumbParameters, 'rootRef'>>,
    BaseUIComponentProps<'span', SliderThumbOwnerState> {
  onPointerLeave?: React.PointerEventHandler;
  onPointerOver?: React.PointerEventHandler;
  onBlur?: React.FocusEventHandler;
  onFocus?: React.FocusEventHandler;
  onKeyDown?: React.KeyboardEventHandler;
}

export interface UseSliderThumbParameters
  extends Pick<
    UseSliderReturnValue,
    | 'active'
    | 'aria-labelledby'
    | 'axis'
    | 'changeValue'
    | 'isRtl'
    | 'largeStep'
    | 'max'
    | 'min'
    | 'name'
    | 'orientation'
    | 'unsortedPercentageValues'
    | 'scale'
    | 'setOpen'
    | 'step'
    | 'tabIndex'
    | 'unsortedValues'
  > {
  /**
   * The label for the input element.
   */
  'aria-label'?: string;
  /**
   * A string value that provides a user-friendly name for the current value of the slider.
   */
  'aria-valuetext'?: string;
  /**
   * Accepts a function which returns a string value that provides a user-friendly name for the input associated with the thumb
   * @param {number} index The index of the input
   * @returns {string}
   */
  getAriaLabel?: (index: number) => string;
  /**
   * Accepts a function which returns a string value that provides a user-friendly name for the current value of the slider.
   * This is important for screen reader users.
   * @param {number} value The thumb label's value to format.
   * @param {number} index The thumb label's index to format.
   * @returns {string}
   */
  getAriaValueText?: (value: number, index: number) => string;
  id?: string;
  disabled?: boolean;
  onBlur?: React.FocusEventHandler;
  onFocus?: React.FocusEventHandler;
  onKeyDown?: React.KeyboardEventHandler;
  rootRef?: React.Ref<Element>;
}

export interface UseSliderThumbReturnValue {
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'span'>,
  ) => React.ComponentPropsWithRef<'span'>;
  getThumbInputProps: (
    externalProps?: React.ComponentPropsWithRef<'input'>,
  ) => React.ComponentPropsWithRef<'input'>;
  /**
   * Resolver for the thumb slot's style prop.
   * @param index of the currently moved thumb
   * @returns props that should be spread on the style prop of thumb slot
   */
  getThumbStyle: (index: number) => Record<string, unknown>;
  index: number;
}
