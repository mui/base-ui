import { TemporalAdapter, TemporalValue } from '../../types';
import { TemporalFieldStoreParameters } from './types';

export function createDefaultStoreParameters(
  adapter: TemporalAdapter,
  format: string,
): TemporalFieldStoreParameters<TemporalValue> {
  return {
    value: undefined,
    defaultValue: undefined,
    onValueChange: undefined,
    referenceDate: undefined,
    format,
    step: 1,
    required: undefined,
    disabled: undefined,
    readOnly: undefined,
    name: undefined,
    id: undefined,
    minDate: undefined,
    maxDate: undefined,
    timezone: undefined,
    fieldContext: null,
    adapter,
    direction: 'ltr',
    translations: undefined,
  };
}
