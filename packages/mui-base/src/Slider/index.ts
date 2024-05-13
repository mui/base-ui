export { Slider as Root } from './Root/SliderRoot';
export {
  SliderRootOwnerState as SliderOwnerState,
  SliderRootProps as RootProps,
  UseSliderParameters,
  UseSliderReturnValue,
} from './Root/SliderRoot.types';
export { useSliderRoot } from './Root/useSliderRoot';
export { SliderContext, type SliderContextValue, useSliderContext } from './Root/SliderContext';
export {
  SliderProvider,
  type SliderProviderValue,
  type SliderProviderProps,
} from './Root/SliderProvider';

export { SliderThumb as Thumb } from './SliderThumb/SliderThumb';
export type {
  SliderThumbOwnerState as ThumbOwnerState,
  SliderThumbProps as ThumbProps,
  UseSliderThumbParameters,
  UseSliderThumbReturnValue,
  SliderThumbMetadata as ThumbMetadata,
} from './SliderThumb/SliderThumb.types';
export { useSliderThumb } from './SliderThumb/useSliderThumb';

export { SliderTrack as Track } from './SliderTrack/SliderTrack';
export type { SliderTrackProps as TrackProps } from './SliderTrack/SliderTrack.types';
export { useSliderTrack } from './SliderTrack/useSliderTrack';

export { SliderOutput as Output } from './SliderOutput/SliderOutput';
export type { SliderOutputProps as OutputProps } from './SliderOutput/SliderOutput.types';
export { useSliderOutput } from './SliderOutput/useSliderOutput';
