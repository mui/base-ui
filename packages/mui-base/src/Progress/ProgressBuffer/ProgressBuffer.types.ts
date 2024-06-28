import { BaseUIComponentProps } from '../../utils/types';
import { ProgressDirection, ProgressRootOwnerState } from '../Root/ProgressRoot.types';

export interface ProgressBufferProps extends BaseUIComponentProps<'span', ProgressRootOwnerState> {}

export interface UseProgressBufferParameters {
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
   * The buffer value.
   */
  bufferValue: number;
}

export interface UseProgressBufferReturnValue {
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'span'>,
  ) => React.ComponentPropsWithRef<'span'>;
}
