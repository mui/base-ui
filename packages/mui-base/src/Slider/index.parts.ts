export { SliderRoot as Root } from './Root/SliderRoot';
export type {
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

export { SliderOutput as Output } from './Output/SliderOutput';
export type {
  SliderOutputProps as OutputProps,
  UseSliderOutputParameters,
  UseSliderOutputReturnValue,
} from './Output/SliderOutput.types';
export { useSliderOutput } from './Output/useSliderOutput';

export { SliderControl as Control } from './Control/SliderControl';
export type {
  SliderControlProps as ControlProps,
  UseSliderControlParameters,
  UseSliderControlReturnValue,
} from './Control/SliderControl.types';
export { useSliderControl } from './Control/useSliderControl';

export { SliderTrack as Track } from './Track/SliderTrack';
export type { SliderTrackProps as TrackProps } from './Track/SliderTrack.types';

export { SliderThumb as Thumb } from './Thumb/SliderThumb';
export type {
  SliderThumbOwnerState as ThumbOwnerState,
  SliderThumbProps as ThumbProps,
  UseSliderThumbParameters,
  UseSliderThumbReturnValue,
} from './Thumb/SliderThumb.types';
export { useSliderThumb } from './Thumb/useSliderThumb';

export { SliderIndicator as Indicator } from './Indicator/SliderIndicator';
export type {
  SliderIndicatorProps as IndicatorProps,
  UseSliderIndicatorParameters,
  UseSliderIndicatorReturnValue,
} from './Indicator/SliderIndicator.types';
export { useSliderIndicator } from './Indicator/useSliderIndicator';
