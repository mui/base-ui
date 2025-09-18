import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import type { SliderRoot } from './SliderRoot';

export const sliderStateAttributesMapping: StateAttributesMapping<SliderRoot.State> = {
  activeThumbIndex: () => null,
  max: () => null,
  min: () => null,
  minStepsBetweenValues: () => null,
  step: () => null,
  values: () => null,
};
