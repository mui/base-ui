import type { ScrubHandle } from './useScrub.types';
import type { BaseUIComponentProps } from '../../utils/types';

export type NumberFieldRootOwnerState = {
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

export interface NumberFieldRootProps
  extends UseNumberFieldRootParameters,
    Omit<BaseUIComponentProps<'div', NumberFieldRootOwnerState>, 'onChange' | 'defaultValue'> {}

export type NumberFieldContextValue = UseNumberFieldRootReturnValue & {
  ownerState: NumberFieldRootOwnerState;
};

export interface UseNumberFieldRootParameters {
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
   * Callback fired when the number value changes.
   * @param {number | null} value The new value.
   */
  onChange?: (value: number | null) => void;
}

export interface UseNumberFieldRootReturnValue {
  getGroupProps: (
    externalProps?: React.ComponentPropsWithRef<'div'>,
  ) => React.ComponentPropsWithRef<'div'>;
  getInputProps: (
    externalProps?: React.ComponentPropsWithRef<'input'>,
  ) => React.ComponentPropsWithRef<'input'>;
  getIncrementButtonProps: (
    externalProps?: React.ComponentPropsWithRef<'button'>,
  ) => React.ComponentPropsWithRef<'button'>;
  getDecrementButtonProps: (
    externalProps?: React.ComponentPropsWithRef<'button'>,
  ) => React.ComponentPropsWithRef<'button'>;
  getScrubAreaProps: (
    externalProps?: React.ComponentPropsWithRef<'span'>,
  ) => React.ComponentPropsWithRef<'span'>;
  getScrubAreaCursorProps: (
    externalProps?: React.ComponentPropsWithRef<'span'>,
  ) => React.ComponentPropsWithRef<'span'>;
  inputValue: string;
  value: number | null;
  isScrubbing: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  scrubHandleRef: React.RefObject<ScrubHandle | null>;
  scrubAreaRef: React.RefObject<HTMLSpanElement>;
  scrubAreaCursorRef: React.RefObject<HTMLSpanElement>;
}
