import type { StateAttributesMapping } from '../../utils/mapStateAttributes';
import type { SliderRoot } from './SliderRoot';

export const sliderMapping: StateAttributesMapping<SliderRoot.State> = {
  activeThumbIndex: () => null,
  max: () => null,
  min: () => null,
  minStepsBetweenValues: () => null,
  step: () => null,
  values: () => null,
};
