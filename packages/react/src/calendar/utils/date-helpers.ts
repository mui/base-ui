import { TemporalAdapter, TemporalSupportedObject } from '../../models';

export function getFirstEnabledYear(
  adapter: TemporalAdapter,
  validationProps: { minDate: TemporalSupportedObject },
): TemporalSupportedObject {
  return adapter.startOfYear(validationProps.minDate);
}

export function getLastEnabledYear(
  adapter: TemporalAdapter,
  validationProps: { maxDate: TemporalSupportedObject },
): TemporalSupportedObject {
  return adapter.startOfYear(validationProps.maxDate);
}
