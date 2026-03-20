import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import type { SliderRootState } from './SliderRoot';
import { fieldValidityMapping } from '../../field/utils/constants';

export const sliderStateAttributesMapping: StateAttributesMapping<SliderRootState> = {
  activeThumbIndex: () => null,
  max: () => null,
  min: () => null,
  minStepsBetweenValues: () => null,
  step: () => null,
  values: () => null,
  ...fieldValidityMapping,
};
