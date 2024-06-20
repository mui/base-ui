import { BaseUIComponentProps } from '../../utils/types';
import { SliderRootOwnerState, UseSliderReturnValue } from '../Root/SliderRoot.types';

export interface SliderThumbOwnerState extends SliderRootOwnerState {}

export interface SliderThumbProps
  extends Partial<Omit<UseSliderThumbParameters, 'rootRef'>>,
    Omit<BaseUIComponentProps<'span', SliderThumbOwnerState>, 'render'> {
  onPointerLeave?: React.PointerEventHandler;
  onPointerOver?: React.PointerEventHandler;
  onBlur?: React.FocusEventHandler;
  onFocus?: React.FocusEventHandler;
  onKeyDown?: React.KeyboardEventHandler;
  /**
   * A function to customize rendering of the component.
   */
  render?:
    | ((
        props: React.ComponentPropsWithRef<'span'>,
        state: SliderThumbOwnerState,
        inputProps: React.ComponentPropsWithRef<'input'>,
      ) => React.ReactElement)
    | (React.ReactElement & { ref: React.Ref<Element> });
}

export interface UseSliderThumbParameters
  extends Pick<
    UseSliderReturnValue,
    | 'active'
    | 'aria-labelledby'
    | 'axis'
    | 'changeValue'
    | 'direction'
    | 'largeStep'
    | 'max'
    | 'min'
    | 'minStepsBetweenValues'
    | 'name'
    | 'orientation'
    | 'percentageValues'
    | 'scale'
    | 'step'
    | 'tabIndex'
    | 'values'
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
    externalProps?: React.ComponentPropsWithRef<React.ElementType>,
  ) => React.ComponentPropsWithRef<React.ElementType>;
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
