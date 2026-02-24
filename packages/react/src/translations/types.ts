import type { TemporalFieldDatePartType, TemporalFieldSectionContentType } from '../types';

export interface BaseUITranslations {
  /** Label for the year section of a temporal field. Used as aria-label. */
  temporalFieldYearSectionLabel: string;
  /** Label for the month section of a temporal field. Used as aria-label. */
  temporalFieldMonthSectionLabel: string;
  /** Label for the day section of a temporal field. Used as aria-label. */
  temporalFieldDaySectionLabel: string;
  /** Label for the week day section of a temporal field. Used as aria-label. */
  temporalFieldWeekDaySectionLabel: string;
  /** Label for the hours section of a temporal field. Used as aria-label. */
  temporalFieldHoursSectionLabel: string;
  /** Label for the minutes section of a temporal field. Used as aria-label. */
  temporalFieldMinutesSectionLabel: string;
  /** Label for the seconds section of a temporal field. Used as aria-label. */
  temporalFieldSecondsSectionLabel: string;
  /** Label for the meridiem (AM/PM) section of a temporal field. Used as aria-label. */
  temporalFieldMeridiemSectionLabel: string;
  /** Text displayed as aria-valuetext when a temporal field section is empty. */
  temporalFieldEmptySectionText: string;
  /** Placeholder for the year section of a temporal field. */
  temporalFieldYearPlaceholder: (params: { digitAmount: number }) => string;
  /** Placeholder for the month section of a temporal field. */
  temporalFieldMonthPlaceholder: (params: {
    contentType: TemporalFieldSectionContentType;
  }) => string;
  /** Placeholder for the week day section of a temporal field. */
  temporalFieldWeekDayPlaceholder: (params: {
    contentType: TemporalFieldSectionContentType;
  }) => string;
  /** Placeholder for the day section of a temporal field. */
  temporalFieldDayPlaceholder: () => string;
  /** Placeholder for the hours section of a temporal field. */
  temporalFieldHoursPlaceholder: () => string;
  /** Placeholder for the minutes section of a temporal field. */
  temporalFieldMinutesPlaceholder: () => string;
  /** Placeholder for the seconds section of a temporal field. */
  temporalFieldSecondsPlaceholder: () => string;
  /** Placeholder for the meridiem (AM/PM) section of a temporal field. */
  temporalFieldMeridiemPlaceholder: () => string;
}

type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

/**
 * Maps TemporalFieldDatePartType to the corresponding translation key for section labels.
 */
export const temporalFieldSectionLabelKey: Record<
  TemporalFieldDatePartType,
  StringKeys<BaseUITranslations>
> = {
  year: 'temporalFieldYearSectionLabel',
  month: 'temporalFieldMonthSectionLabel',
  day: 'temporalFieldDaySectionLabel',
  weekDay: 'temporalFieldWeekDaySectionLabel',
  hours: 'temporalFieldHoursSectionLabel',
  minutes: 'temporalFieldMinutesSectionLabel',
  seconds: 'temporalFieldSecondsSectionLabel',
  meridiem: 'temporalFieldMeridiemSectionLabel',
};
