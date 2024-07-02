import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { SliderRootOwnerState } from './SliderRoot.types';

export const sliderStyleHookMapping: CustomStyleHookMapping<SliderRootOwnerState> = {
  activeThumbIndex: () => null,
  direction: () => null,
  max: () => null,
  min: () => null,
  minStepsBetweenValues: () => null,
  step: () => null,
  values: () => null,
};
