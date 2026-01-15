import {
  TemporalAdapter,
  TemporalFormatTokenConfig,
  TemporalSupportedObject,
} from '../../../types';
import {
  TemporalFieldParsedFormat,
  TemporalFieldPlaceholderGetters,
  TemporalFieldToken,
} from './types';
import { TextDirection } from '../../../direction-provider';

const DEFAULT_PLACEHOLDER_GETTERS: Required<TemporalFieldPlaceholderGetters> = {
  year: (params) => 'Y'.repeat(params.digitAmount),
  month: (params) => (params.contentType === 'letter' ? 'MMMM' : 'MM'),
  day: () => 'DD',
  weekDay: (params) => (params.contentType === 'letter' ? 'EEEE' : 'EE'),
  hours: () => 'hh',
  minutes: () => 'mm',
  seconds: () => 'ss',
  meridiem: () => 'aa',
};

/**
 * Class used to convert a format into a list of tokens, a prefix and a suffix.
 * If the format contains localized meta tokens (like "P" for Date Fns), it is expanded first.
 */
export class FormatParser {
  private adapter: TemporalAdapter;

  private format: string;

  private placeholderGetters: Required<TemporalFieldPlaceholderGetters>;

  private direction: TextDirection;

  private now: TemporalSupportedObject;

  private nowFormattedMap = new Map<string, string>();

  /**
   * Converts a format into a list of tokens, a prefix and a suffix.
   */
  public static parse(
    adapter: TemporalAdapter,
    format: string,
    direction: TextDirection,
    placeholderGetters: TemporalFieldPlaceholderGetters | undefined,
  ) {
    const parser = new FormatParser(adapter, format, direction, placeholderGetters);
    const expandedFormat = parser.expandFormat();
    const escapedParts = parser.computeEscapedParts(expandedFormat);
    const parsedFormat = parser.parse(expandedFormat, escapedParts);

    if (direction === 'rtl') {
      for (const token of parsedFormat.tokens) {
        if (token.separator.includes(' ')) {
          token.separator = `\u2069${token.separator}\u2066`;
        }
      }
    }

    return parsedFormat;
  }

  /**
   * Builds the object representation of the given token.
   * The placeholder property will always be empty.
   */
  public static buildSingleToken(adapter: TemporalAdapter, tokenValue: string): TemporalFieldToken {
    const parser = new FormatParser(adapter, '', 'ltr', undefined);
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
    placeholderGetters: TemporalFieldPlaceholderGetters | undefined,
  ) {
    this.adapter = adapter;
    this.format = format;
    this.direction = direction;
    this.placeholderGetters = { ...DEFAULT_PLACEHOLDER_GETTERS, ...placeholderGetters };
    this.now = adapter.now('default');
  }

  /**
   * Formats this.now with the given token, caching the result to avoid duplicate formatting calls.
   */
  private formatNowByToken(tokenValue: string): string {
    if (!this.nowFormattedMap.has(tokenValue)) {
      this.nowFormattedMap.set(tokenValue, this.adapter.formatByString(this.now, tokenValue));
    }
    return this.nowFormattedMap.get(tokenValue)!;
  }

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
    const isPadded = this.isTokenPadded(tokenValue, tokenConfig);

    let maxLength: number | undefined;
    if (isPadded && tokenConfig.contentType === 'digit') {
      maxLength = this.formatNowByToken(tokenValue).length;
    } else if (isPadded && tokenConfig.contentType === 'digit-with-letter') {
      // For digit-with-letter formats (e.g., '1st', '2nd'), we need to extract only the digit part
      const formatted = this.formatNowByToken(tokenValue);
      // Remove all non-digit characters to get the length of just the digits
      maxLength = formatted.replace(/\D/g, '').length;
    }

    return {
      value: tokenValue,
      config: tokenConfig,
      isPadded,
      maxLength,
      placeholder: this.getTokenPlaceholder(tokenValue, tokenConfig),
      separator: '',
    };
  }

  private isTokenPadded(token: string, tokenConfig: TemporalFormatTokenConfig): boolean {
    if (tokenConfig.contentType !== 'digit') {
      return false;
    }

    switch (tokenConfig.sectionType) {
      // We can't use `changeSectionValueFormat`, because  `adapter.parse('1', 'YYYY')` returns `1971` instead of `1`.
      case 'year': {
        // Remove once https://github.com/iamkun/dayjs/pull/2847 is merged and bump dayjs version
        if (this.adapter.lib === 'dayjs' && token === 'YY') {
          return true;
        }
        return this.adapter
          .formatByString(this.adapter.setYear(this.now, 1), token)
          .startsWith('0');
      }

      case 'month': {
        return this.adapter.formatByString(this.adapter.startOfYear(this.now), token).length > 1;
      }

      case 'day': {
        return this.adapter.formatByString(this.adapter.startOfMonth(this.now), token).length > 1;
      }

      case 'weekDay': {
        return this.adapter.formatByString(this.adapter.startOfWeek(this.now), token).length > 1;
      }

      case 'hours': {
        return this.adapter.formatByString(this.adapter.setHours(this.now, 1), token).length > 1;
      }

      case 'minutes': {
        return this.adapter.formatByString(this.adapter.setMinutes(this.now, 1), token).length > 1;
      }

      case 'seconds': {
        return this.adapter.formatByString(this.adapter.setSeconds(this.now, 1), token).length > 1;
      }

      default: {
        throw new Error('Invalid section type');
      }
    }
  }

  private getTokenPlaceholder(tokenValue: string, config: TemporalFormatTokenConfig): string {
    switch (config.sectionType) {
      case 'year': {
        return this.placeholderGetters.year({
          digitAmount: this.formatNowByToken(tokenValue).length,
          format: tokenValue,
        });
      }

      case 'month': {
        return this.placeholderGetters.month({
          contentType: config.contentType,
          format: tokenValue,
        });
      }

      case 'day': {
        return this.placeholderGetters.day({ format: tokenValue });
      }

      case 'weekDay': {
        return this.placeholderGetters.weekDay({
          contentType: config.contentType,
          format: tokenValue,
        });
      }

      case 'hours': {
        return this.placeholderGetters.hours({ format: tokenValue });
      }

      case 'minutes': {
        return this.placeholderGetters.minutes({ format: tokenValue });
      }

      case 'seconds': {
        return this.placeholderGetters.seconds({ format: tokenValue });
      }

      case 'meridiem': {
        return this.placeholderGetters.meridiem({ format: tokenValue });
      }

      default: {
        return tokenValue;
      }
    }
  }

  private parse(
    expandedFormat: string,
    escapedParts: FormatEscapedParts,
  ): TemporalFieldParsedFormat {
    const tokens: TemporalFieldToken[] = [];
    let prefix = '';
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

          // Set prefix only when creating the very first token
          if (tokens.length === 0) {
            prefix = separator;
            separator = '';
          }

          tokens.push(this.createToken(firstWord));
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
          if (tokens.length === 0) {
            separator += char;
          } else {
            tokens[tokens.length - 1].separator += char;
          }
        }

        i += 1;
      }
    }

    let suffix = '';
    if (tokens.length > 0) {
      suffix = tokens[tokens.length - 1].separator;
      tokens[tokens.length - 1].separator = '';
    }

    return { tokens, suffix, prefix };
  }
}

type FormatEscapedParts = { start: number; end: number }[];
