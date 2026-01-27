import {
  TemporalAdapter,
  TemporalFieldDatePartType,
  TemporalFieldPlaceholderGetters,
  TemporalFormatTokenConfig,
  TemporalSupportedObject,
} from '../../../types';
import {
  TemporalFieldDatePartValueBoundaries,
  TemporalFieldParsedFormat,
  TemporalFieldSeparator,
  TemporalFieldToken,
  TemporalFieldValidationProps,
} from './types';
import { TextDirection } from '../../../direction-provider';
import { DATE_PART_GRANULARITY, isSeparator, isToken, removeLocalizedDigits } from './utils';
import {
  getLocalizedDigits,
  getLongestMonthInCurrentYear,
  getWeekDaysStr,
  getYearFormatLength,
} from './adapter-cache';
import { ValidateDateValidationProps } from '../validateDate';
import { ValidateTimeValidationProps } from '../validateTime';
import { get } from 'http';

const DATE_PART_CONFIG_MAP: Record<TemporalFieldDatePartType, FormatParserDatePartConfig> = {
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
    getTokenPlaceholder(placeholderGetters, tokenValue, tokenConfig, formatNowByToken) {
      const digitAmount = formatNowByToken(tokenValue).length;
      if (placeholderGetters?.year === undefined) {
        return 'Y'.repeat(digitAmount);
      }

      return placeholderGetters.year({
        digitAmount,
        format: tokenValue,
      });
    },
    isDigitTokenPadded(adapter, tokenValue, now) {
      // Uncomment if Day.js support is added.
      // Remove once https://github.com/iamkun/dayjs/pull/2847 is merged and released.
      // if (this.adapter.lib === 'dayjs' && token === 'YY') {
      //   return true;
      // }
      return adapter.formatByString(adapter.setYear(now, 1), tokenValue).startsWith('0');
    },
  },
  month: {
    getBoundaries(adapter, tokenValue, tokenConfig, validationProps) {
      const boundaries = {
        minimum: 1,
        // Assumption: All years have the same amount of months
        maximum: adapter.getMonth(adapter.endOfYear(adapter.now('default'))) + 1,
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
    getTokenPlaceholder(placeholderGetters, tokenValue, tokenConfig) {
      if (placeholderGetters?.month === undefined) {
        return tokenConfig.contentType === 'letter' ? 'MMMM' : 'MM';
      }

      return placeholderGetters.month({
        contentType: tokenConfig.contentType,
        format: tokenValue,
      });
    },
    isDigitTokenPadded(adapter, tokenValue, now) {
      return adapter.formatByString(adapter.startOfYear(now), tokenValue).length > 1;
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
        // TODO: See if we can add support for minTime/maxTime affecting weekDay boundaries
        adjustment: boundaries,
      };
    },
    getTokenPlaceholder(placeholderGetters, tokenValue, tokenConfig) {
      if (placeholderGetters?.weekDay === undefined) {
        return tokenConfig.contentType === 'letter' ? 'EEEE' : 'EE';
      }

      return placeholderGetters.weekDay({
        contentType: tokenConfig.contentType,
        format: tokenValue,
      });
    },
    isDigitTokenPadded(adapter, tokenValue, now) {
      return adapter.formatByString(adapter.startOfWeek(now), tokenValue).length > 1;
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
    getTokenPlaceholder(placeholderGetters, tokenValue) {
      if (placeholderGetters?.day === undefined) {
        return 'DD';
      }

      return placeholderGetters.day({ format: tokenValue });
    },
    isDigitTokenPadded(adapter, tokenValue, now) {
      return adapter.formatByString(adapter.startOfMonth(now), tokenValue).length > 1;
    },
  },
  hours: {
    getBoundaries(adapter, tokenValue, tokenConfig, validationProps) {
      let boundaries: { minimum: number; maximum: number };
      const localizedDigits = getLocalizedDigits(adapter);
      const today = adapter.now('default');
      const endOfDay = adapter.endOfDay(today);
      const lastHourInDay = adapter.getHours(endOfDay);
      const hasMeridiem =
        removeLocalizedDigits(adapter.formatByString(endOfDay, tokenValue), localizedDigits) !==
        lastHourInDay.toString();

      if (hasMeridiem) {
        boundaries = {
          minimum: 1,
          maximum: Number(
            removeLocalizedDigits(
              adapter.formatByString(adapter.startOfDay(today), tokenValue),
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

      const minTime = validationProps.minTime ?? null;
      const maxTime = validationProps.maxTime ?? null;

      // Only use minTime and maxTime to restrict hours if they share the same day
      const shouldIgnoreValidation =
        !adapter.isValid(minTime) ||
        !adapter.isValid(maxTime) ||
        !adapter.isSameDay(minTime, maxTime);

      return {
        characterEditing: boundaries,
        adjustment: shouldIgnoreValidation
          ? boundaries
          : {
              minimum: adapter.getHours(minTime),
              maximum: adapter.getHours(maxTime),
            },
      };
    },
    getTokenPlaceholder(placeholderGetters, tokenValue) {
      if (placeholderGetters?.hours === undefined) {
        return 'hh';
      }

      return placeholderGetters.hours({ format: tokenValue });
    },
    isDigitTokenPadded(adapter, tokenValue, now) {
      return adapter.formatByString(adapter.setHours(now, 1), tokenValue).length > 1;
    },
  },
  minutes: {
    getBoundaries(adapter, tokenValue, tokenConfig, validationProps) {
      const boundaries = {
        minimum: 0,
        maximum: adapter.getMinutes(adapter.endOfDay(adapter.now('default'))),
      };

      const minTime = validationProps.minTime ?? null;
      const maxTime = validationProps.maxTime ?? null;

      // Only use minTime and maxTime to restrict minutes if they share the same hour
      const shouldIgnoreValidation =
        !adapter.isValid(minTime) ||
        !adapter.isValid(maxTime) ||
        !adapter.isSameHour(minTime, maxTime);

      return {
        characterEditing: boundaries,
        adjustment: shouldIgnoreValidation
          ? boundaries
          : {
              minimum: adapter.getMinutes(minTime),
              maximum: adapter.getMinutes(maxTime),
            },
      };
    },
    getTokenPlaceholder(placeholderGetters, tokenValue) {
      if (placeholderGetters?.minutes === undefined) {
        return 'mm';
      }

      return placeholderGetters.minutes({ format: tokenValue });
    },
    isDigitTokenPadded(adapter, tokenValue, now) {
      return adapter.formatByString(adapter.setMinutes(now, 1), tokenValue).length > 1;
    },
  },
  seconds: {
    getBoundaries(adapter, tokenValue, tokenConfig, validationProps) {
      const boundaries = {
        minimum: 0,
        maximum: adapter.getSeconds(adapter.endOfDay(adapter.now('default'))),
      };

      const minTime = validationProps.minTime ?? null;
      const maxTime = validationProps.maxTime ?? null;

      // Only use minTime and maxTime to restrict seconds if they share the same minute
      const shouldIgnoreValidation =
        !adapter.isValid(minTime) ||
        !adapter.isValid(maxTime) ||
        // Equivalent to adapter.isSameMinute(minTime, maxTime) if it existed
        !adapter.isSameHour(minTime, maxTime) ||
        adapter.getMinutes(minTime) !== adapter.getMinutes(maxTime);

      return {
        characterEditing: boundaries,
        adjustment: shouldIgnoreValidation
          ? boundaries
          : {
              minimum: adapter.getSeconds(minTime),
              maximum: adapter.getSeconds(maxTime),
            },
      };
    },
    getTokenPlaceholder(placeholderGetters, tokenValue) {
      if (placeholderGetters?.seconds === undefined) {
        return 'ss';
      }

      return placeholderGetters.seconds({ format: tokenValue });
    },
    isDigitTokenPadded(adapter, tokenValue, now) {
      return adapter.formatByString(adapter.setSeconds(now, 1), tokenValue).length > 1;
    },
  },
  meridiem: {
    getBoundaries(adapter, tokenValue, tokenConfig, validationProps) {
      const boundaries = { minimum: 0, maximum: 1 };

      const minTime = validationProps.minTime ?? null;
      const maxTime = validationProps.maxTime ?? null;

      const getMeridiemValue = (date: TemporalSupportedObject) => {
        const hours = adapter.getHours(date);
        return hours < 12 ? 0 : 1;
      };

      // Only use minTime and maxTime to restrict hours if they share the same day
      const shouldIgnoreValidation =
        !adapter.isValid(minTime) ||
        !adapter.isValid(maxTime) ||
        // Equivalent to adapter.isSameMeridiem(minTime, maxTime) if it existed
        !adapter.isSameDay(minTime, maxTime) ||
        getMeridiemValue(minTime) !== getMeridiemValue(maxTime);

      return {
        characterEditing: boundaries,
        adjustment: shouldIgnoreValidation
          ? boundaries
          : { minimum: getMeridiemValue(minTime), maximum: getMeridiemValue(maxTime) },
      };
    },
    getTokenPlaceholder(placeholderGetters, tokenValue) {
      if (placeholderGetters?.meridiem === undefined) {
        return 'aa';
      }

      return placeholderGetters.meridiem({ format: tokenValue });
    },
    isDigitTokenPadded() {
      // Meridiem is never a digit section.
      return false;
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

  private placeholderGetters: Partial<TemporalFieldPlaceholderGetters> | undefined;

  private validationProps: TemporalFieldValidationProps;

  private direction: TextDirection;

  private now: TemporalSupportedObject;

  private nowFormattedMap = new Map<string, string>();

  /**
   * Converts a format into a list of tokens and separators.
   */
  public static parse(
    adapter: TemporalAdapter,
    format: string,
    direction: TextDirection,
    placeholderGetters: Partial<TemporalFieldPlaceholderGetters> | undefined,
    validationProps: TemporalFieldValidationProps,
  ) {
    const parser = new FormatParser(
      adapter,
      format,
      direction,
      placeholderGetters,
      validationProps,
    );
    const expandedFormat = parser.expandFormat();
    const escapedParts = parser.computeEscapedParts(expandedFormat);
    const parsedFormat = parser.parse(expandedFormat, escapedParts);
    FormatParser.markMostGranularPart(parsedFormat);

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
    const parser = new FormatParser(adapter, '', 'ltr', undefined, validationProps);
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
        [
          `Base UI: The token "${tokenValue}" is not supported by the Base UI components.`,
          'Please try using another token or open an issue on https://github.com/mui/base-ui/issues/new/choose if you think it should be supported.',
        ].join('\n'),
      );
    }

    return config;
  }

  private constructor(
    adapter: TemporalAdapter,
    format: string,
    direction: TextDirection,
    placeholderGetters: Partial<TemporalFieldPlaceholderGetters> | undefined,
    validationProps: TemporalFieldValidationProps,
  ) {
    this.adapter = adapter;
    this.format = format;
    this.direction = direction;
    this.placeholderGetters = placeholderGetters;
    this.now = adapter.now('default');
    this.validationProps = validationProps;
  }

  /**
   * Formats this.now with the given token, caching the result to avoid duplicate formatting calls.
   */
  private formatNowByToken = (tokenValue: string): string => {
    if (!this.nowFormattedMap.has(tokenValue)) {
      this.nowFormattedMap.set(tokenValue, this.adapter.formatByString(this.now, tokenValue));
    }
    return this.nowFormattedMap.get(tokenValue)!;
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
    const isPadded =
      tokenConfig.contentType === 'digit'
        ? DATE_PART_CONFIG_MAP[tokenConfig.part].isDigitTokenPadded(
            this.adapter,
            tokenValue,
            this.now,
          )
        : false;

    let maxLength: number | undefined;
    if (isPadded && tokenConfig.contentType === 'digit') {
      maxLength = this.formatNowByToken(tokenValue).length;
    } else if (isPadded && tokenConfig.contentType === 'digit-with-letter') {
      // For digit-with-letter formats (e.g., '1st', '2nd'), we need to extract only the digit part
      const formatted = this.formatNowByToken(tokenValue);
      // Remove all non-digit characters to get the length of just the digits
      maxLength = formatted.replace(/\D/g, '').length;
    }

    const datePartConfig = DATE_PART_CONFIG_MAP[tokenConfig.part];

    return {
      type: 'token',
      value: tokenValue,
      config: tokenConfig,
      isPadded,
      maxLength,
      placeholder: datePartConfig.getTokenPlaceholder(
        this.placeholderGetters,
        tokenValue,
        tokenConfig,
        this.formatNowByToken,
      ),
      boundaries: datePartConfig.getBoundaries(
        this.adapter,
        tokenValue,
        tokenConfig,
        this.validationProps,
      ),
      isMostGranularPart: false,
    };
  }

  private parse(
    expandedFormat: string,
    escapedParts: FormatEscapedParts,
  ): TemporalFieldParsedFormat {
    const elements: (TemporalFieldToken | TemporalFieldSeparator)[] = [];
    let separator: string = '';

    // This RegExp tests if the beginning of a string corresponds to a supported token
    const validTokens = Object.keys(this.adapter.formatTokenConfigMap).sort(
      (a, b) => b.length - a.length,
    ); // Sort to put longest word first

    const regExpFirstWordInFormat = /^([a-zA-Z]+)/;
    const regExpWordOnlyComposedOfTokens = new RegExp(`^(${validTokens.join('|')})*$`);
    const regExpFirstTokenInWord = new RegExp(`^(${validTokens.join('|')})`);

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

    return { elements, granularity: 'year' };
  }

  private static markMostGranularPart(parsedFormat: TemporalFieldParsedFormat): void {
    let mostGranularToken: TemporalFieldToken | null = null;
    let highestGranularity = 0;

    for (const element of parsedFormat.elements) {
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
      parsedFormat.granularity = mostGranularToken.config.part;
    }
  }
}

type FormatEscapedParts = { start: number; end: number }[];

interface FormatParserDatePartConfig {
  getBoundaries(
    adapter: TemporalAdapter,
    tokenValue: string,
    tokenConfig: TemporalFormatTokenConfig,
    validationProps: ValidateDateValidationProps & ValidateTimeValidationProps,
  ): TemporalFieldDatePartValueBoundaries;
  getTokenPlaceholder(
    placeholderGetters: Partial<TemporalFieldPlaceholderGetters> | undefined,
    tokenValue: string,
    tokenConfig: TemporalFormatTokenConfig,
    formatNowByToken: (token: string) => string,
  ): string;
  isDigitTokenPadded: (
    adapter: TemporalAdapter,
    tokenValue: string,
    now: TemporalSupportedObject,
  ) => boolean;
}
