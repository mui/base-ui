import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { SliderRoot } from './SliderRoot';

export const sliderStyleHookMapping: CustomStyleHookMapping<SliderRoot.State> = {
  activeThumbIndex: () => null,
  max: () => null,
  min: () => null,
  minStepsBetweenValues: () => null,
  step: () => null,
  values: () => null,
};
