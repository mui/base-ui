import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps.js';
import type { SliderRoot } from './SliderRoot.js';

export const sliderStyleHookMapping: CustomStyleHookMapping<SliderRoot.OwnerState> = {
  activeThumbIndex: () => null,
  direction: () => null,
  max: () => null,
  min: () => null,
  minStepsBetweenValues: () => null,
  step: () => null,
  values: () => null,
};
