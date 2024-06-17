import { BaseUIComponentProps } from '../../utils/types';
import { SliderRootOwnerState } from '../Root/SliderRoot.types';

export interface SliderTrackProps extends BaseUIComponentProps<'span', SliderRootOwnerState> {}

export interface UseSliderTrackParameters {
  rootRef?: React.Ref<Element>;
}

export interface UseSliderTrackReturnValue {
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'span'>,
  ) => React.ComponentPropsWithRef<'span'>;
}
