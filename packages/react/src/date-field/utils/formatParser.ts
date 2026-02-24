import {
  TemporalAdapter,
  TemporalFieldDatePartType,
  TemporalFormatTokenConfig,
  TemporalSupportedObject,
} from '../../types';
import type { BaseUITranslations } from '../../translations/types';
import { enUS } from '../../translations/enUS';
import {
  TemporalFieldDatePart,
  TemporalFieldDatePartValueBoundaries,
  TemporalFieldParsedFormat,
  TemporalFieldSeparator,
  TemporalFieldToken,
  TemporalFieldValidationProps,
} from './types';
import { TextDirection } from '../../direction-provider';
import { DATE_PART_GRANULARITY, isSeparator, isToken, removeLocalizedDigits } from './utils';
import {
  getArbitraryDate,
  getFormatTokenRegExps,
  getLocalizedDigits,
  getLongestMonthInCurrentYear,
  getWeekDaysStr,
  getYearFormatLength,
} from './adapter-cache';
import { ValidateDateValidationProps } from '../../utils/temporal/validateDate';

const DATE_PART_HELPERS_MAP: Record<TemporalFieldDatePartType, FormatParserDatePartConfig> = {
  year: {
    getBoundaries(adapter, tokenValue, tokenConfig, validationProps) {
      const boundaries = {
        minimum: 0,
        maximum: getYearFormatLength(adapter, tokenValue) === 4 ? 9999 : 99,
      };

      const minDate = validationProps.minDate ?? null;
      const maxDate = validationProps.maxDate ?? null;

      return {
        characterEditing: boundaries,
        adjustment: {
          minimum: adapter.isValid(minDate) ? adapter.getYear(minDate) : boundaries.minimum,
          maximum: adapter.isValid(maxDate) ? adapter.getYear(maxDate) : boundaries.maximum,
        },
      };
    },
    getTokenPlaceholder(translations, tokenValue, tokenConfig, formatArbitraryDateByToken) {
      const digitAmount = formatArbitraryDateByToken(tokenValue).length;
      return translations.temporalFieldYearPlaceholder({ digitAmount });
    },
    isDigitTokenPadded(adapter, tokenValue, now) {
      // Uncomment if Day.js support is added.
      // Remove once https://github.com/iamkun/dayjs/pull/2847 is merged and released.
      // if (this.adapter.lib === 'dayjs' && token === 'YY') {
      //   return true;
      // }
      return adapter.formatByString(adapter.setYear(now, 1), tokenValue).startsWith('0');
    },
    transferValue(adapter, sourceDate, targetDate, _datePart) {
      return adapter.setYear(targetDate, adapter.getYear(sourceDate));
    },
  },
  month: {
    getBoundaries(adapter, tokenValue, tokenConfig, validationProps) {
      const boundaries = {
        minimum: 1,
        // Assumption: All years have the same amount of months
        maximum: adapter.getMonth(adapter.endOfYear(getArbitraryDate(adapter))) + 1,
      };

      const minDate = validationProps.minDate ?? null;
      const maxDate = validationProps.maxDate ?? null;

      // Only use minDate and maxDate to restrict month if they share the same year
      const shouldIgnoreValidation =
        !adapter.isValid(minDate) ||
        !adapter.isValid(maxDate) ||
        !adapter.isSameYear(minDate, maxDate);

      return {
        characterEditing: boundaries,
        adjustment: shouldIgnoreValidation
          ? boundaries
          : {
              minimum: adapter.getMonth(minDate) + 1,
              maximum: adapter.getMonth(maxDate) + 1,
            },
      };
    },
    getTokenPlaceholder(translations, tokenValue, tokenConfig) {
      return translations.temporalFieldMonthPlaceholder({
        contentType: tokenConfig.contentType,
      });
    },
    isDigitTokenPadded(adapter, tokenValue, now) {
      return adapter.formatByString(adapter.startOfYear(now), tokenValue).length > 1;
    },
    transferValue(adapter, sourceDate, targetDate, _datePart) {
      return adapter.setMonth(targetDate, adapter.getMonth(sourceDate));
    },
  },
  weekDay: {
    getBoundaries(adapter, tokenValue, tokenConfig) {
      let boundaries: { minimum: number; maximum: number };
      if (tokenConfig.contentType === 'digit') {
        const daysInWeek = getWeekDaysStr(adapter, tokenValue).map(Number);
        boundaries = {
          minimum: Math.min(...daysInWeek),
          maximum: Math.max(...daysInWeek),
        };
      } else {
        boundaries = { minimum: 1, maximum: 7 };
      }

      return {
        characterEditing: boundaries,
        // TODO: See if we can add support for minDate/maxDate affecting weekDay boundaries
        adjustment: boundaries,
      };
    },
    getTokenPlaceholder(translations, tokenValue, tokenConfig) {
      return translations.temporalFieldWeekDayPlaceholder({
        contentType: tokenConfig.contentType,
      });
    },
    isDigitTokenPadded(adapter, tokenValue, now) {
      return adapter.formatByString(adapter.startOfWeek(now), tokenValue).length > 1;
    },
    transferValue(adapter, sourceDate, _targetDate, datePart) {
      // We can't use targetDate here, because if both day and weekDay are in the format,
      // Then targetDate's weekDay might not reflect datePart.value.
      const formattedDaysInWeek = getWeekDaysStr(adapter, datePart.token.value);
      const sourceDayInWeek = formattedDaysInWeek.indexOf(
        adapter.formatByString(sourceDate, datePart.token.value),
      );
      const targetDayInWeek = formattedDaysInWeek.indexOf(datePart.value);
      const diff = targetDayInWeek - sourceDayInWeek;
      return adapter.addDays(sourceDate, diff);
    },
  },
  day: {
    getBoundaries(adapter, tokenValue, tokenConfig, validationProps) {
      const boundaries = {
        minimum: 1,
        maximum: adapter.getDaysInMonth(getLongestMonthInCurrentYear(adapter)),
      };

      const minDate = validationProps.minDate ?? null;
      const maxDate = validationProps.maxDate ?? null;

      // Only use minDate and maxDate to restrict day if they share the same month
      const shouldIgnoreValidation =
        !adapter.isValid(minDate) ||
        !adapter.isValid(maxDate) ||
        !adapter.isSameMonth(minDate, maxDate);

      return {
        characterEditing: boundaries,
        adjustment: shouldIgnoreValidation
          ? boundaries
          : {
              minimum: adapter.getDate(minDate),
              maximum: adapter.getDate(maxDate),
            },
      };
    },
    getTokenPlaceholder(translations) {
      return translations.temporalFieldDayPlaceholder();
    },
    isDigitTokenPadded(adapter, tokenValue, now) {
      return adapter.formatByString(adapter.startOfMonth(now), tokenValue).length > 1;
    },
    transferValue(adapter, sourceDate, targetDate, _datePart) {
      return adapter.setDate(targetDate, adapter.getDate(sourceDate));
    },
  },
  hours: {
    getBoundaries(adapter, tokenValue, tokenConfig, validationProps) {
      let boundaries: { minimum: number; maximum: number };
      const localizedDigits = getLocalizedDigits(adapter);
      const arbitraryDate = getArbitraryDate(adapter);
      const endOfDay = adapter.endOfDay(arbitraryDate);
      const lastHourInDay = adapter.getHours(endOfDay);
      const hasMeridiem =
        removeLocalizedDigits(adapter.formatByString(endOfDay, tokenValue), localizedDigits) !==
        lastHourInDay.toString();

      if (hasMeridiem) {
        boundaries = {
          minimum: 1,
          maximum: Number(
            removeLocalizedDigits(
              adapter.formatByString(adapter.startOfDay(arbitraryDate), tokenValue),
              localizedDigits,
            ),
          ),
        };
      } else {
        boundaries = {
          minimum: 0,
          maximum: lastHourInDay,
        };
      }

      const minDate = validationProps.minDate ?? null;
      const maxDate = validationProps.maxDate ?? null;

      // Only use minDate and maxDate to restrict hours if they share the same day
      const shouldIgnoreValidation =
        !adapter.isValid(minDate) ||
        !adapter.isValid(maxDate) ||
        !adapter.isSameDay(minDate, maxDate);

      return {
        characterEditing: boundaries,
        adjustment: shouldIgnoreValidation
          ? boundaries
          : {
              minimum: adapter.getHours(minDate),
              maximum: adapter.getHours(maxDate),
            },
      };
    },
    getTokenPlaceholder(translations) {
      return translations.temporalFieldHoursPlaceholder();
    },
    isDigitTokenPadded(adapter, tokenValue, now) {
      return adapter.formatByString(adapter.setHours(now, 1), tokenValue).length > 1;
    },
    transferValue(adapter, sourceDate, targetDate, _datePart) {
      return adapter.setHours(targetDate, adapter.getHours(sourceDate));
    },
  },
  minutes: {
    getBoundaries(adapter, tokenValue, tokenConfig, validationProps) {
      const boundaries = {
        minimum: 0,
        maximum: adapter.getMinutes(adapter.endOfDay(getArbitraryDate(adapter))),
      };

      const minDate = validationProps.minDate ?? null;
      const maxDate = validationProps.maxDate ?? null;

      // Only use minDate and maxDate to restrict minutes if they share the same hour
      const shouldIgnoreValidation =
        !adapter.isValid(minDate) ||
        !adapter.isValid(maxDate) ||
        !adapter.isSameHour(minDate, maxDate);

      return {
        characterEditing: boundaries,
        adjustment: shouldIgnoreValidation
          ? boundaries
          : {
              minimum: adapter.getMinutes(minDate),
              maximum: adapter.getMinutes(maxDate),
            },
      };
    },
    getTokenPlaceholder(translations) {
      return translations.temporalFieldMinutesPlaceholder();
    },
    isDigitTokenPadded(adapter, tokenValue, now) {
      return adapter.formatByString(adapter.setMinutes(now, 1), tokenValue).length > 1;
    },
    transferValue(adapter, sourceDate, targetDate, _datePart) {
      return adapter.setMinutes(targetDate, adapter.getMinutes(sourceDate));
    },
  },
  seconds: {
    getBoundaries(adapter, tokenValue, tokenConfig, validationProps) {
      const boundaries = {
        minimum: 0,
        maximum: adapter.getSeconds(adapter.endOfDay(getArbitraryDate(adapter))),
      };

      const minDate = validationProps.minDate ?? null;
      const maxDate = validationProps.maxDate ?? null;

      // Only use minDate and maxDate to restrict seconds if they share the same minute
      const shouldIgnoreValidation =
        !adapter.isValid(minDate) ||
        !adapter.isValid(maxDate) ||
        // Equivalent to adapter.isSameMinute(minDate, maxDate) if it existed
        !adapter.isSameHour(minDate, maxDate) ||
        adapter.getMinutes(minDate) !== adapter.getMinutes(maxDate);

      return {
        characterEditing: boundaries,
        adjustment: shouldIgnoreValidation
          ? boundaries
          : {
              minimum: adapter.getSeconds(minDate),
              maximum: adapter.getSeconds(maxDate),
            },
      };
    },
    getTokenPlaceholder(translations) {
      return translations.temporalFieldSecondsPlaceholder();
    },
    isDigitTokenPadded(adapter, tokenValue, now) {
      return adapter.formatByString(adapter.setSeconds(now, 1), tokenValue).length > 1;
    },
    transferValue(adapter, sourceDate, targetDate, _datePart) {
      return adapter.setSeconds(targetDate, adapter.getSeconds(sourceDate));
    },
  },
  meridiem: {
    getBoundaries(adapter, tokenValue, tokenConfig, validationProps) {
      const boundaries = { minimum: 0, maximum: 1 };

      const minDate = validationProps.minDate ?? null;
      const maxDate = validationProps.maxDate ?? null;

      const getMeridiemValue = (date: TemporalSupportedObject) => {
        const hours = adapter.getHours(date);
        return hours < 12 ? 0 : 1;
      };

      // Only use minDate and maxDate to restrict hours if they share the same day
      const shouldIgnoreValidation =
        !adapter.isValid(minDate) ||
        !adapter.isValid(maxDate) ||
        // Equivalent to adapter.isSameMeridiem(minDate, maxDate) if it existed
        !adapter.isSameDay(minDate, maxDate) ||
        getMeridiemValue(minDate) !== getMeridiemValue(maxDate);

      return {
        characterEditing: boundaries,
        adjustment: shouldIgnoreValidation
          ? boundaries
          : { minimum: getMeridiemValue(minDate), maximum: getMeridiemValue(maxDate) },
      };
    },
    getTokenPlaceholder(translations) {
      return translations.temporalFieldMeridiemPlaceholder();
    },
    isDigitTokenPadded() {
      // Meridiem is never a digit date part.
      return false;
    },
    transferValue(adapter, sourceDate, targetDate, _datePart) {
      const sourceIsAM = adapter.getHours(sourceDate) < 12;
      const targetIsAM = adapter.getHours(targetDate) < 12;

      if (sourceIsAM === targetIsAM) {
        return targetDate;
      }

      return adapter.addHours(targetDate, sourceIsAM ? -12 : 12);
    },
  },
};

/**
 * Class used to convert a format into a list of tokens and separators.
 * If the format contains localized meta tokens (like "P" for Date Fns), it is expanded first.
 */
export class FormatParser {
  private adapter: TemporalAdapter;

  private format: string;

  private translations: BaseUITranslations;

  private validationProps: TemporalFieldValidationProps;

  private direction: TextDirection;

  private arbitraryDateFormattedMap = new Map<string, string>();

  /**
   * Converts a format into a list of tokens and separators.
   */
  public static parse(
    adapter: TemporalAdapter,
    format: string,
    direction: TextDirection,
    translations: BaseUITranslations,
    validationProps: TemporalFieldValidationProps,
  ) {
    const parser = new FormatParser(adapter, format, direction, translations, validationProps);
    const expandedFormat = parser.expandFormat();
    const escapedParts = parser.computeEscapedParts(expandedFormat);
    const parsedFormat = parser.parse(expandedFormat, escapedParts);

    if (direction === 'rtl') {
      for (const element of parsedFormat.elements) {
        if (isSeparator(element) && element.value.includes(' ')) {
          element.value = `\u2069${element.value}\u2066`;
        }
      }
    }

    return parsedFormat;
  }

  /**
   * Builds the object representation of the given token.
   * The placeholder property will always be empty.
   */
  public static buildSingleToken(
    adapter: TemporalAdapter,
    tokenValue: string,
    validationProps: TemporalFieldValidationProps,
  ): TemporalFieldToken {
    const parser = new FormatParser(adapter, '', 'ltr', enUS, validationProps);
    return parser.createToken(tokenValue);
  }

  /**
   * Returns the configuration of a given token.
   */
  public static getTokenConfig(
    adapter: TemporalAdapter,
    tokenValue: string,
  ): TemporalFormatTokenConfig {
    const config = adapter.formatTokenConfigMap[tokenValue];

    if (config == null) {
      throw new Error(
        'Base UI: Some token in the format is not supported by the Base UI components.\nPlease try using another token or open an issue on https://github.com/mui/base-ui/issues/new/choose if you think it should be supported.',
      );
    }

    return config;
  }

  private constructor(
    adapter: TemporalAdapter,
    format: string,
    direction: TextDirection,
    translations: BaseUITranslations,
    validationProps: TemporalFieldValidationProps,
  ) {
    this.adapter = adapter;
    this.format = format;
    this.direction = direction;
    this.translations = translations;
    this.validationProps = validationProps;
  }

  /**
   * Formats the arbitrary date with the given token, caching the result to avoid duplicate formatting calls.
   */
  private formatArbitraryDateByToken = (tokenValue: string): string => {
    if (!this.arbitraryDateFormattedMap.has(tokenValue)) {
      this.arbitraryDateFormattedMap.set(
        tokenValue,
        this.adapter.formatByString(getArbitraryDate(this.adapter), tokenValue),
      );
    }
    return this.arbitraryDateFormattedMap.get(tokenValue)!;
  };

  /**
   * Expands the format until is doesn't have any meta tokens left.
   */
  private expandFormat() {
    let formatExpansionOverflow = 10;
    let prevFormat = this.format;
    let nextFormat = this.adapter.expandFormat(this.format);
    while (nextFormat !== prevFormat) {
      prevFormat = nextFormat;
      nextFormat = this.adapter.expandFormat(prevFormat);
      formatExpansionOverflow -= 1;
      if (formatExpansionOverflow < 0) {
        throw new Error(
          'Base UI: The format expansion seems to be in an infinite loop. Please open an issue with the format passed to the component.',
        );
      }
    }

    if (this.direction === 'rtl') {
      nextFormat = nextFormat.split(' ').reverse().join(' ');
    }

    return nextFormat;
  }

  private computeEscapedParts(expandedFormat: string): FormatEscapedParts {
    const escapedParts: FormatEscapedParts = [];
    const { start: startChar, end: endChar } = this.adapter.escapedCharacters;
    const regExp = new RegExp(`(\\${startChar}[^\\${endChar}]*\\${endChar})+`, 'g');

    let match: RegExpExecArray | null = null;
    // eslint-disable-next-line no-cond-assign
    while ((match = regExp.exec(expandedFormat))) {
      escapedParts.push({ start: match.index, end: regExp.lastIndex - 1 });
    }

    return escapedParts;
  }

  private createToken(tokenValue: string): TemporalFieldToken {
    if (tokenValue === '') {
      throw new Error('Base UI: Should not call `createToken` with an empty token');
    }

    const tokenConfig = FormatParser.getTokenConfig(this.adapter, tokenValue);
    const helpers = DATE_PART_HELPERS_MAP[tokenConfig.part];

    const isPadded =
      tokenConfig.contentType === 'letter'
        ? false
        : helpers.isDigitTokenPadded(this.adapter, tokenValue, getArbitraryDate(this.adapter));

    const boundaries = helpers.getBoundaries(
      this.adapter,
      tokenValue,
      tokenConfig,
      this.validationProps,
    );

    const maxLength =
      isPadded && tokenConfig.contentType !== 'letter'
        ? String(boundaries.characterEditing.maximum).length
        : undefined;

    return {
      type: 'token',
      isPadded,
      value: tokenValue,
      config: tokenConfig,
      isMostGranularPart: false,
      maxLength,
      placeholder: helpers.getTokenPlaceholder(
        this.translations,
        tokenValue,
        tokenConfig,
        this.formatArbitraryDateByToken,
      ),
      boundaries,
      transferValue: (sourceDate, targetDate, datePart) =>
        helpers.transferValue(this.adapter, sourceDate, targetDate, datePart),
    };
  }

  private parse(
    expandedFormat: string,
    escapedParts: FormatEscapedParts,
  ): TemporalFieldParsedFormat {
    const elements: (TemporalFieldToken | TemporalFieldSeparator)[] = [];
    let separator: string = '';

    // These RegExps test if the beginning of a string corresponds to a supported token.
    // They are cached per adapter instance since they depend only on formatTokenConfigMap.
    const regExpFirstWordInFormat = /^([a-zA-Z]+)/;
    const { regExpWordOnlyComposedOfTokens, regExpFirstTokenInWord } = getFormatTokenRegExps(
      this.adapter,
    );

    const getEscapedPartOfCurrentChar = (i: number) =>
      escapedParts.find((escapeIndex) => escapeIndex.start <= i && escapeIndex.end >= i);

    let i = 0;
    while (i < expandedFormat.length) {
      const escapedPartOfCurrentChar = getEscapedPartOfCurrentChar(i);
      const isEscapedChar = escapedPartOfCurrentChar != null;
      const firstWordInFormat = regExpFirstWordInFormat.exec(expandedFormat.slice(i))?.[1];

      // The first word in the format is only composed of tokens.
      // We extract those tokens to create a new token.
      if (
        !isEscapedChar &&
        firstWordInFormat != null &&
        regExpWordOnlyComposedOfTokens.test(firstWordInFormat)
      ) {
        let word = firstWordInFormat;
        while (word.length > 0) {
          const firstWord = regExpFirstTokenInWord.exec(word)![1];
          word = word.slice(firstWord.length);

          // If there is a separator before the very first token, add it as a prefix separator
          if (elements.length === 0 && separator !== '') {
            elements.push({ type: 'separator', value: separator, index: 0 });
            separator = '';
          }

          elements.push(this.createToken(firstWord));
        }

        i += firstWordInFormat.length;
      }
      // The remaining format does not start with a token,
      // We take the first character and add it to the current token's separator.
      else {
        const char = expandedFormat[i];

        // If we are on the opening or closing character of an escaped part of the format,
        // Then we ignore this character.
        const isEscapeBoundary =
          (isEscapedChar && escapedPartOfCurrentChar?.start === i) ||
          escapedPartOfCurrentChar?.end === i;

        if (!isEscapeBoundary) {
          if (elements.length === 0) {
            separator += char;
          } else {
            // If there is no separator yet, we create it
            if (isToken(elements[elements.length - 1])) {
              elements.push({ type: 'separator', value: '', index: 0 });
            }

            (elements[elements.length - 1] as TemporalFieldSeparator).value += char;
          }
        }

        i += 1;
      }
    }

    // Mark the most granular part
    let mostGranularToken: TemporalFieldToken | null = null;
    let highestGranularity = 0;

    for (const element of elements) {
      if (isToken(element)) {
        const granularity = DATE_PART_GRANULARITY[element.config.part] ?? 0;
        if (granularity > highestGranularity) {
          highestGranularity = granularity;
          mostGranularToken = element;
        }
      }
    }

    if (mostGranularToken) {
      mostGranularToken.isMostGranularPart = true;
    }

    return { elements, granularity: mostGranularToken?.config.part ?? 'year' };
  }
}

type FormatEscapedParts = { start: number; end: number }[];

interface FormatParserDatePartConfig {
  getBoundaries(
    adapter: TemporalAdapter,
    tokenValue: string,
    tokenConfig: TemporalFormatTokenConfig,
    validationProps: ValidateDateValidationProps,
  ): TemporalFieldDatePartValueBoundaries;
  getTokenPlaceholder(
    translations: BaseUITranslations,
    tokenValue: string,
    tokenConfig: TemporalFormatTokenConfig,
    formatArbitraryDateByToken: (token: string) => string,
  ): string;
  isDigitTokenPadded: (
    adapter: TemporalAdapter,
    tokenValue: string,
    now: TemporalSupportedObject,
  ) => boolean;
  transferValue: (
    adapter: TemporalAdapter,
    sourceDate: TemporalSupportedObject,
    targetDate: TemporalSupportedObject,
    datePart: TemporalFieldDatePart,
  ) => TemporalSupportedObject;
}
