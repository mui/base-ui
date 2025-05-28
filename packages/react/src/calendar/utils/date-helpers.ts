import { TemporalAdapter, TemporalSupportedObject } from '../../models';

export function getFirstEnabledMonth(
  adapter: TemporalAdapter,
  validationProps: { minDate: TemporalSupportedObject },
): TemporalSupportedObject {
  return adapter.startOfMonth(validationProps.minDate);
}

export function getLastEnabledMonth(
  adapter: TemporalAdapter,
  validationProps: { maxDate: TemporalSupportedObject },
): TemporalSupportedObject {
  return adapter.startOfMonth(validationProps.maxDate);
}

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
