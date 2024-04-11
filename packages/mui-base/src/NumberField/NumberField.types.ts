import type { BaseUIComponentProps } from '../utils/BaseUI.types';

export interface NumberFieldOwnerState {
  /**
   * The raw number value of the input element.
   */
  value: number | null;
  /**
   * The string value of the input element.
   */
  inputValue: string;
  /**
   * If `true`, the input element is required.
   */
  required: boolean;
  /**
   * If `true`, the input element is disabled.
   */
  disabled: boolean;
  /**
   * If `true`, the input element is invalid.
   */
  invalid: boolean;
  /**
   * If `true`, the input element is read only.
   */
  readOnly: boolean;
  /**
   * If `true`, the value is being scrubbed.
   */
  scrubbing: boolean;
}

export interface NumberFieldProps
  extends Omit<BaseUIComponentProps<'div', NumberFieldOwnerState>, 'onChange'> {
  /**
   * The id of the input element.
   */
  id?: string;
  /**
   * The minimum value of the input element.
   */
  min?: number;
  /**
   * The maximum value of the input element.
   */
  max?: number;
  /**
   * The small step value of the input element when incrementing while the meta key is held. Snaps
   * to multiples of this value.
   * @default 0.1
   */
  smallStep?: number;
  /**
   * The step value of the input element when incrementing, decrementing, or scrubbing. It will snap
   * to multiples of this value. When unspecified, decimal values are allowed, but the stepper
   * buttons will increment or decrement by `1`.
   */
  step?: number;
  /**
   * The large step value of the input element when incrementing while the shift key is held. Snaps
   * to multiples of this value.
   * @default 10
   */
  largeStep?: number;
  /**
   * If `true`, the input element is required.
   * @default false
   */
  required?: boolean;
  /**
   * If `true`, the input element is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * If `true`, the input element is invalid.
   * @default false
   */
  invalid?: boolean;
  /**
   * If `true`, the input element is focused on mount.
   * @default false
   */
  autoFocus?: boolean;
  /**
   * If `true`, the input element is read only.
   * @default false
   */
  readOnly?: boolean;
  /**
   * The name of the input element.
   */
  name?: string;
  /**
   * The raw number value of the input element.
   */
  value?: number | null;
  /**
   * The default value of the input element. Use when the component is not controlled.
   */
  defaultValue?: number;
  /**
   * Whether to allow the user to scrub the input value with the mouse wheel while focused and
   * hovering over the input.
   * @default false
   */
  allowWheelScrub?: boolean;
  /**
   * Options to format the input value.
   */
  format?: Intl.NumberFormatOptions;
  /**
   * @param value the raw number value of the input element.
   */
  onChange?: (value: number | null) => void;
}

export interface NumberFieldGroupProps extends BaseUIComponentProps<'div', NumberFieldOwnerState> {}

export interface NumberFieldInputProps
  extends BaseUIComponentProps<'input', NumberFieldOwnerState> {}

export interface NumberFieldIncrementProps
  extends BaseUIComponentProps<'button', NumberFieldOwnerState> {}

export interface NumberFieldDecrementProps
  extends BaseUIComponentProps<'button', NumberFieldOwnerState> {}

export interface NumberFieldScrubAreaProps
  extends BaseUIComponentProps<'span', NumberFieldOwnerState> {
  /**
   * The direction that the scrub area should change the value.
   * @default 'vertical'
   */
  direction?: 'vertical' | 'horizontal';
  /**
   * Determines the number of pixels the cursor must move before the value changes. A higher value
   * will make the scrubbing less sensitive.
   * @default 2
   */
  pixelSensitivity?: number;
  /**
   * If specified, how much the cursor can move around the center of the scrub area element before
   * it will loop back around.
   */
  teleportDistance?: number | undefined;
}

export interface NumberFieldScrubAreaCursorProps
  extends BaseUIComponentProps<'span', NumberFieldOwnerState> {}
