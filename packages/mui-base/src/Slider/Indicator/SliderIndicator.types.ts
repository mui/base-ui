import { BaseUIComponentProps } from '../../utils/types';
import { SliderRootOwnerState, UseSliderReturnValue } from '../Root/SliderRoot.types';

export interface SliderIndicatorProps extends BaseUIComponentProps<'span', SliderRootOwnerState> {}

export interface UseSliderIndicatorParameters
  extends Pick<
    UseSliderReturnValue,
    'axis' | 'direction' | 'disabled' | 'orientation' | 'percentageValues'
  > {}

export interface UseSliderIndicatorReturnValue {
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'span'>,
  ) => React.ComponentPropsWithRef<'span'>;
}
