import type { UseNumberFieldParameters } from '../useNumberField';
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
  extends Omit<BaseUIComponentProps<'div', NumberFieldOwnerState>, 'onChange' | 'defaultValue'>,
    UseNumberFieldParameters {}

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
