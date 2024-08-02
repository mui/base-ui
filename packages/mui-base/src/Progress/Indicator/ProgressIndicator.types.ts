import { BaseUIComponentProps } from '../../utils/types';
import { ProgressDirection, ProgressRootOwnerState } from '../Root/ProgressRoot.types';

export interface ProgressIndicatorProps
  extends BaseUIComponentProps<'span', ProgressRootOwnerState> {}

export interface UseProgressIndicatorParameters {
  /**
   * The direction that progress bars fill in
   * @default 'ltr'
   */
  direction?: ProgressDirection;
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
   */
  value: number | null;
}

export interface UseProgressIndicatorReturnValue {
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'span'>,
  ) => React.ComponentPropsWithRef<'span'>;
}
