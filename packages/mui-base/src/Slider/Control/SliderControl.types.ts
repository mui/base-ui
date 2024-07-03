import { BaseUIComponentProps } from '../../utils/types';
import { SliderRootOwnerState, UseSliderReturnValue } from '../Root/SliderRoot.types';

export interface SliderControlProps extends BaseUIComponentProps<'span', SliderRootOwnerState> {}

export interface UseSliderControlParameters
  extends Pick<
    UseSliderReturnValue,
    | 'areValuesEqual'
    | 'disabled'
    | 'dragging'
    | 'getFingerNewValue'
    | 'handleValueChange'
    | 'minStepsBetweenValues'
    | 'onValueCommitted'
    | 'percentageValues'
    | 'registerSliderControl'
    | 'setActive'
    | 'setDragging'
    | 'setValueState'
    | 'step'
    | 'subitems'
  > {
  /**
   * The ref attached to the control area of the Slider.
   */
  rootRef?: React.Ref<Element>;
}

export interface UseSliderControlReturnValue {
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'span'>,
  ) => React.ComponentPropsWithRef<'span'>;
}
