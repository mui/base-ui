import { BaseUIComponentProps } from '../../utils/types';
import { SliderRootOwnerState, UseSliderReturnValue } from '../Root/SliderRoot.types';

export interface SliderOutputProps extends BaseUIComponentProps<'output', SliderRootOwnerState> {}

export interface UseSliderOutputParameters extends Pick<UseSliderReturnValue, 'subitems'> {
  'aria-live'?: React.AriaAttributes['aria-live'];
  /**
   * Ref to the root slot's DOM element.
   */
  rootRef?: React.Ref<Element>;
}

export interface UseSliderOutputReturnValue {
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'output'>,
  ) => React.ComponentPropsWithRef<'output'>;
}
