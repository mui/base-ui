import { TemporalSupportedObject } from '../../../types';
import { TemporalFieldSection } from './types';
import { DATE_PART_GRANULARITY, isDatePart } from './utils';

export function mergeDateIntoReferenceDate(
  sourceDate: TemporalSupportedObject,
  sections: TemporalFieldSection[],
  referenceDate: TemporalSupportedObject,
  shouldLimitToEditedSections: boolean,
): TemporalSupportedObject {
  const dateParts = sections
    .filter(isDatePart)
    .sort(
      (a, b) =>
        DATE_PART_GRANULARITY[a.token.config.part] - DATE_PART_GRANULARITY[b.token.config.part],
    );

  let targetDate = referenceDate;
  for (const datePart of dateParts) {
    if (!shouldLimitToEditedSections || datePart.modified) {
      targetDate = datePart.token.transferValue(sourceDate, targetDate);
    }
  }
  return targetDate;
}
