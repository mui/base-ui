import type { UseNumberFieldParameters } from '../useNumberField';
import type { BaseUIComponentProps } from '../utils/BaseUI.types';

export type OwnerState = {
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
};

export interface RootProps
  extends UseNumberFieldParameters,
    Omit<BaseUIComponentProps<'div', OwnerState>, 'onChange' | 'defaultValue'> {}

export interface GroupProps extends BaseUIComponentProps<'div', OwnerState> {}

export interface InputProps extends BaseUIComponentProps<'input', OwnerState> {}

export interface IncrementProps extends BaseUIComponentProps<'button', OwnerState> {}

export interface DecrementProps extends BaseUIComponentProps<'button', OwnerState> {}

export interface ScrubAreaProps extends BaseUIComponentProps<'span', OwnerState> {
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

export interface ScrubAreaCursorProps extends BaseUIComponentProps<'span', OwnerState> {}
