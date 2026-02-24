import type { BaseUITranslations } from './types';

export const enUS: BaseUITranslations = {
  temporalFieldYearSectionLabel: 'Year',
  temporalFieldMonthSectionLabel: 'Month',
  temporalFieldDaySectionLabel: 'Day',
  temporalFieldWeekDaySectionLabel: 'Week day',
  temporalFieldHoursSectionLabel: 'Hours',
  temporalFieldMinutesSectionLabel: 'Minutes',
  temporalFieldSecondsSectionLabel: 'Seconds',
  temporalFieldMeridiemSectionLabel: 'Meridiem',
  temporalFieldEmptySectionText: 'Empty',
  temporalFieldYearPlaceholder: ({ digitAmount }) => 'Y'.repeat(digitAmount),
  temporalFieldMonthPlaceholder: ({ contentType }) => (contentType === 'letter' ? 'MMMM' : 'MM'),
  temporalFieldWeekDayPlaceholder: ({ contentType }) => (contentType === 'letter' ? 'EEEE' : 'EE'),
  temporalFieldDayPlaceholder: () => 'DD',
  temporalFieldHoursPlaceholder: () => '--',
  temporalFieldMinutesPlaceholder: () => '--',
  temporalFieldSecondsPlaceholder: () => '--',
  temporalFieldMeridiemPlaceholder: () => '--',
};
