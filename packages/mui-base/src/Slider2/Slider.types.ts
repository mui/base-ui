import { UseSliderParameters } from '../useSlider2/useSlider.types';
import { UseSliderThumbParameters } from '../useSlider2/useSliderThumb.types';
import type { BaseUIComponentProps } from '../utils/BaseUI.types';

export interface SliderOwnerState {
  /**
   * If `true`, the component is disabled.
   */
  disabled: boolean;
  min: number;
  max: number;
  /**
   * The raw number value of the slider.
   */
  value: number | ReadonlyArray<number>;
}

export interface RootProps
  extends UseSliderParameters,
    Omit<BaseUIComponentProps<'div', SliderOwnerState>, 'defaultValue' | 'onChange' | 'value'> {
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

/*
export type HiddenInputProps = {
  'aria-labelledby'?: string;
  'aria-orientation'?: React.AriaAttributes['aria-orientation'];
  'aria-valuemax'?: React.AriaAttributes['aria-valuemax'];
  'aria-valuemin'?: React.AriaAttributes['aria-valuemin'];
  // to disable an individual thumb
  disabled: boolean; // move to thumb
  name?: string; // move to thumb
  onBlur: React.FocusEventHandler; // move to thumb
  onChange: React.ChangeEventHandler<HTMLInputElement>; // move to thumb
  onFocus: React.FocusEventHandler; // move to thumb
  step?: number;
  style: React.CSSProperties;
  tabIndex?: number; // move to thumb
  type?: React.InputHTMLAttributes<HTMLInputElement>['type']; // remove? hard code to 'range'
};
*/

export interface ThumbProps
  extends UseSliderThumbParameters,
    BaseUIComponentProps<'div', SliderOwnerState> {
  onPointerLeave?: React.PointerEventHandler;
  onPointerOver?: React.PointerEventHandler;
  onBlur?: React.FocusEventHandler;
  onFocus?: React.FocusEventHandler;
  onKeyDown?: React.KeyboardEventHandler;
}

export interface TrackProps extends BaseUIComponentProps<'div', SliderOwnerState> {}
