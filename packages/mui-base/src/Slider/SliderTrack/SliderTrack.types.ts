import { BaseUIComponentProps } from '../../utils/BaseUI.types';
import { SliderRootOwnerState, UseSliderReturnValue } from '../Root/SliderRoot.types';

export interface SliderTrackProps extends BaseUIComponentProps<'span', SliderRootOwnerState> {}

export interface UseSliderTrackParameters
  extends Pick<
    UseSliderReturnValue,
    | 'areValuesEqual'
    | 'disabled'
    | 'dragging'
    | 'getFingerNewValue'
    | 'handleValueChange'
    | 'onValueCommitted'
    | 'percentageValues'
    | 'registerSliderTrack'
    | 'setActive'
    | 'setDragging'
    | 'setOpen'
    | 'setValueState'
    | 'subitems'
  > {
  /**
   * The ref attached to the track of the Slider.
   */
  rootRef?: React.Ref<Element>;
}

export interface UseSliderTrackReturnValue {
  getRootProps: (
    externalProps?: React.ComponentPropsWithRef<'span'>,
  ) => React.ComponentPropsWithRef<'span'>;
}
