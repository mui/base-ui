import type { BaseUITranslations } from './types';

export const frFR: BaseUITranslations = {
  temporalFieldYearSectionLabel: 'Année',
  temporalFieldMonthSectionLabel: 'Mois',
  temporalFieldDaySectionLabel: 'Jour',
  temporalFieldWeekDaySectionLabel: 'Jour de la semaine',
  temporalFieldHoursSectionLabel: 'Heures',
  temporalFieldMinutesSectionLabel: 'Minutes',
  temporalFieldSecondsSectionLabel: 'Secondes',
  temporalFieldMeridiemSectionLabel: 'Méridien',
  temporalFieldEmptySectionText: 'Vide',
  temporalFieldYearPlaceholder: ({ digitAmount }) => 'A'.repeat(digitAmount),
  temporalFieldMonthPlaceholder: ({ contentType }) => (contentType === 'letter' ? 'MMMM' : 'MM'),
  temporalFieldWeekDayPlaceholder: ({ contentType }) => (contentType === 'letter' ? 'EEEE' : 'EE'),
  temporalFieldDayPlaceholder: () => 'JJ',
  temporalFieldHoursPlaceholder: () => '--',
  temporalFieldMinutesPlaceholder: () => '--',
  temporalFieldSecondsPlaceholder: () => '--',
  temporalFieldMeridiemPlaceholder: () => '--',
};
