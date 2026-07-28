import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { SliderRootState } from './SliderRoot';
import { fieldValidityMapping } from '../../internals/field-constants/constants';

const nullMapping = () => null;

export const sliderStateAttributesMapping: StateAttributesMapping<SliderRootState> = {
  activeThumbIndex: nullMapping,
  max: nullMapping,
  min: nullMapping,
  minStepsBetweenValues: nullMapping,
  step: nullMapping,
  values: nullMapping,
  ...fieldValidityMapping,
};
