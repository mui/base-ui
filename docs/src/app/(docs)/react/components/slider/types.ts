import { Slider } from '@base-ui-components/react/slider';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Slider);

export const TypesSliderRoot = types.Root;
export const TypesSliderValue = types.Value;
export const TypesSliderControl = types.Control;
export const TypesSliderTrack = types.Track;
export const TypesSliderIndicator = types.Indicator;
export const TypesSliderThumb = types.Thumb;
