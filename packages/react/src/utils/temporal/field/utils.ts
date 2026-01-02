import {
  TemporalAdapter,
  TemporalFieldSectionContentType,
  TemporalFieldSectionType,
  TemporalFormatTokenConfig,
  TemporalSupportedValue,
} from '../../../types';
import { TemporalFieldDateType, TemporalFieldSection } from './types';

export const getDateSectionConfigFromFormatToken = (
  adapter: TemporalAdapter,
  formatToken: string,
): TemporalFormatTokenConfig => {
  const config = adapter.formatTokenConfigMap[formatToken];

  if (config == null) {
    throw new Error(
      [
        `MUI X: The token "${formatToken}" is not supported by the Base UI components.`,
        'Please try using another token or open an issue on https://github.com/mui/base-ui/issues/new/choose if you think it should be supported.',
      ].join('\n'),
    );
  }

  return config;
};

export const doesSectionFormatHaveLeadingZeros = (
  adapter: TemporalAdapter,
  contentType: TemporalFieldSectionContentType,
  sectionType: TemporalFieldSectionType,
  format: string,
) => {
  if (contentType !== 'digit') {
    return false;
  }

  const now = adapter.now('default');

  switch (sectionType) {
    // We can't use `changeSectionValueFormat`, because  `adapter.parse('1', 'YYYY')` returns `1971` instead of `1`.
    case 'year': {
      // Remove once https://github.com/iamkun/dayjs/pull/2847 is merged and bump dayjs version
      if (adapter.lib === 'dayjs' && format === 'YY') {
        return true;
      }
      return adapter.formatByString(adapter.setYear(now, 1), format).startsWith('0');
    }

    case 'month': {
      return adapter.formatByString(adapter.startOfYear(now), format).length > 1;
    }

    case 'day': {
      return adapter.formatByString(adapter.startOfMonth(now), format).length > 1;
    }

    case 'weekDay': {
      return adapter.formatByString(adapter.startOfWeek(now), format).length > 1;
    }

    case 'hours': {
      return adapter.formatByString(adapter.setHours(now, 1), format).length > 1;
    }

    case 'minutes': {
      return adapter.formatByString(adapter.setMinutes(now, 1), format).length > 1;
    }

    case 'seconds': {
      return adapter.formatByString(adapter.setSeconds(now, 1), format).length > 1;
    }

    default: {
      throw new Error('Invalid section type');
    }
  }
};

export const applyLocalizedDigits = (valueStr: string, localizedDigits: string[]) => {
  if (localizedDigits[0] === '0') {
    return valueStr;
  }

  return valueStr
    .split('')
    .map((char) => localizedDigits[Number(char)])
    .join('');
};

/**
 * Make sure the value of a digit section have the right amount of leading zeros.
 * E.g.: `03` => `3`
 * Warning: Should only be called with non-localized digits. Call `removeLocalizedDigits` with your value if needed.
 */
export const cleanLeadingZeros = (valueStr: string, size: number) => {
  // Remove the leading zeros and then add back as many as needed.
  return Number(valueStr).toString().padStart(size, '0');
};

export const removeLocalizedDigits = (valueStr: string, localizedDigits: string[]) => {
  if (localizedDigits[0] === '0') {
    return valueStr;
  }

  const digits: string[] = [];
  let currentFormattedDigit = '';
  for (let i = 0; i < valueStr.length; i += 1) {
    currentFormattedDigit += valueStr[i];
    const matchingDigitIndex = localizedDigits.indexOf(currentFormattedDigit);
    if (matchingDigitIndex > -1) {
      digits.push(matchingDigitIndex.toString());
      currentFormattedDigit = '';
    }
  }

  return digits.join('');
};

let warnedOnceInvalidSection = false;

export const validateSections = <TValue extends TemporalSupportedValue>(
  sections: TemporalFieldSection<TValue>[],
  dateType: TemporalFieldDateType,
) => {
  if (process.env.NODE_ENV !== 'production') {
    if (!warnedOnceInvalidSection) {
      const supportedSections: TemporalFieldSectionType[] = ['empty'];
      if (['date', 'date-time'].includes(dateType)) {
        supportedSections.push('weekDay', 'day', 'month', 'year');
      }
      if (['time', 'date-time'].includes(dateType)) {
        supportedSections.push('hours', 'minutes', 'seconds', 'meridiem');
      }

      const invalidSection = sections.find(
        (section) => !supportedSections.includes(section.sectionType),
      );

      if (invalidSection) {
        console.warn(
          `MUI X: The field component you are using is not compatible with the "${invalidSection.sectionType}" date section.`,
          `The supported date sections are ["${supportedSections.join('", "')}"]\`.`,
        );
        warnedOnceInvalidSection = true;
      }
    }
  }
};
