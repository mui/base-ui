import { BaseUIComponentProps } from '../../utils/types';

export type ProgressContextValue = Omit<UseProgressRootReturnValue, 'getRootProps'> & {
  ownerState: ProgressRootOwnerState;
};

export type ProgressRootOwnerState = {
  direction: ProgressDirection;
  max: number;
  min: number;
};

export interface ProgressRootProps
  extends UseProgressRootParameters,
    BaseUIComponentProps<'div', ProgressRootOwnerState> {}

export type ProgressDirection = 'ltr' | 'rtl';

export type ProgressStatus = 'indeterminate' | 'progressing' | 'complete';

export interface UseProgressRootParameters {
  /**
   * The label for the Indicator component.
   */
  'aria-label'?: string;
  /**
   * An id or space-separated list of ids of elements that label the Indicator component.
   */
  'aria-labelledby'?: string;
  /**
   * A string value that provides a human-readable text alternative for the current value of the progress indicator.
   */
  'aria-valuetext'?: string;
  /**
   * The direction that progress bars fill in
   * @default 'ltr'
   */
  direction?: ProgressDirection;
  /**
   * Accepts a function which returns a string value that provides an accessible name for the Indicator component
   * @param {number | null} value The component's value
   * @returns {string}
   */
  getAriaLabel?: (index: number | null) => string;
  /**
   * Accepts a function which returns a string value that provides a human-readable text alternative for the current value of the progress indicator.
   * @param {number | null} value The component's value to format
   * @returns {string}
   */
  getAriaValueText?: (value: number | null) => string;
  /**
   * The maximum value
   * @default 100
   */
  max?: number;
  /**
   * The minimum value
   * @default 0
   */
  min?: number;
  /**
   * The current value. The component is indeterminate when value is `null`.
   * @default null
   */
  value: number | null;
}

export interface UseProgressRootReturnValue {
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'div'>,
  ) => React.ComponentPropsWithRef<'div'>;
  /**
   * The direction that progress bars fill in
   */
  direction: ProgressDirection;
  /**
   * The maximum value
   */
  max: number;
  /**
   * The minimum value
   */
  min: number;
  /**
   * Value of the component
   */
  value: number | null;
  state: ProgressStatus;
}
