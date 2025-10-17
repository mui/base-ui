import { Progress } from '@base-ui-components/react/progress';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Progress);

export const TypesProgressRoot = types.Root;
export const TypesProgressTrack = types.Track;
export const TypesProgressIndicator = types.Indicator;
export const TypesProgressValue = types.Value;
export const TypesProgressLabel = types.Label;
