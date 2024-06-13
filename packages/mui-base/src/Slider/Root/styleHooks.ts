import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { SliderRootOwnerState } from './SliderRoot.types';

export const sliderStyleHookMapping: CustomStyleHookMapping<SliderRootOwnerState> = {
  activeThumbIndex: () => null,
  isRtl: () => null,
  max: () => null,
  min: () => null,
  minDifferenceBetweenValues: () => null,
  step: () => null,
  values: () => null,
};
