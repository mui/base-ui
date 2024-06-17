export { SliderRoot as Root } from './Root/SliderRoot';
export {
  SliderRootOwnerState as SliderOwnerState,
  SliderRootProps as RootProps,
  UseSliderParameters,
  UseSliderReturnValue,
  SliderContextValue,
  SliderProviderValue,
  SliderThumbMetadata,
  Axis,
} from './Root/SliderRoot.types';
export { useSliderRoot } from './Root/useSliderRoot';
export * from './Root/SliderProvider';

export { SliderOutput as Output } from './SliderOutput/SliderOutput';
export type {
  SliderOutputProps as OutputProps,
  UseSliderOutputParameters,
  UseSliderOutputReturnValue,
} from './SliderOutput/SliderOutput.types';
export { useSliderOutput } from './SliderOutput/useSliderOutput';

export { SliderControl as Control } from './SliderControl/SliderControl';
export type {
  SliderControlProps as ControlProps,
  UseSliderControlParameters,
  UseSliderControlReturnValue,
} from './SliderControl/SliderControl.types';
export { useSliderControl } from './SliderControl/useSliderControl';

export { SliderTrack as Track } from './SliderTrack/SliderTrack';
export type {
  SliderTrackProps as TrackProps,
  UseSliderTrackParameters,
  UseSliderTrackReturnValue,
} from './SliderTrack/SliderTrack.types';
export { useSliderTrack } from './SliderTrack/useSliderTrack';

export { SliderThumb as Thumb } from './SliderThumb/SliderThumb';
export type {
  SliderThumbOwnerState as ThumbOwnerState,
  SliderThumbProps as ThumbProps,
  UseSliderThumbParameters,
  UseSliderThumbReturnValue,
} from './SliderThumb/SliderThumb.types';
export { useSliderThumb } from './SliderThumb/useSliderThumb';

export { SliderIndicator as Indicator } from './SliderIndicator/SliderIndicator';
export type {
  SliderIndicatorProps as IndicatorProps,
  UseSliderIndicatorParameters,
  UseSliderIndicatorReturnValue,
} from './SliderIndicator/SliderIndicator.types';
export { useSliderIndicator } from './SliderIndicator/useSliderIndicator';
