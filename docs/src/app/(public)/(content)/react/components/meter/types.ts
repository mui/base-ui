import { Meter } from '@base-ui-components/react/meter';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Meter);

export const TypesMeterRoot = types.Root;
export const TypesMeterTrack = types.Track;
export const TypesMeterIndicator = types.Indicator;
export const TypesMeterValue = types.Value;
export const TypesMeterLabel = types.Label;
