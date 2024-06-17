import { BaseUIComponentProps } from '../../utils/types';
import { SliderRootOwnerState, UseSliderReturnValue } from '../Root/SliderRoot.types';

export interface SliderIndicatorProps extends BaseUIComponentProps<'span', SliderRootOwnerState> {}

export interface UseSliderIndicatorParameters
  extends Pick<
    UseSliderReturnValue,
    'axis' | 'direction' | 'disabled' | 'orientation' | 'percentageValues'
  > {
  /**
   * Ref to the root slot's DOM element.
   */
  rootRef?: React.Ref<Element>;
}

export interface UseSliderIndicatorReturnValue {
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'span'>,
  ) => React.ComponentPropsWithRef<'span'>;
}
