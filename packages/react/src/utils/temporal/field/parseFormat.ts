import { TemporalAdapter, TemporalFormatTokenConfig } from '../../../types';
import { TemporalFieldPlaceholderGetters, TemporalFieldToken } from './types';
import { doesSectionFormatHaveLeadingZeros, getFormatTokenConfig } from './utils';
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
 * Class used to parse and expand a date format.
 */
export class FormatParser {
  private adapter: TemporalAdapter;

  private format: string;

  private placeholderGetters: Required<TemporalFieldPlaceholderGetters>;

  private direction: TextDirection;

  public static build(
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
      parsedFormat.tokens = parsedFormat.tokens.map((token) => {
        const cleanSeparator = (separator: string) => {
          if (separator.includes(' ')) {
            return `\u2069${separator}\u2066`;
          }
          return separator;
        };

        token.separator = cleanSeparator(token.separator);
        return token;
      });
    }

    return parsedFormat;
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

  private createToken(tokenValue: string) {
    if (tokenValue === '') {
      throw new Error('MUI X: Should not call `createToken` with an empty token');
    }

    const tokenConfig = getFormatTokenConfig(this.adapter, tokenValue);

    const isPadded = doesSectionFormatHaveLeadingZeros(
      this.adapter,
      tokenConfig.contentType,
      tokenConfig.sectionType,
      tokenValue,
    );

    // let maxLength: number | undefined;
    // if (isPadded) {
    //   maxLength =
    //     sectionValue === '' ? adapter.formatByString(now, token).length : sectionValue.length;
    // } else {
    //   maxLength = undefined;
    // }

    return {
      tokenValue,
      config: tokenConfig,
      isPadded,
      placeholder: this.getTokenPlaceholder(tokenValue, tokenConfig),
      separator: '',
    };
  }

  private getTokenPlaceholder(tokenValue: string, config: TemporalFormatTokenConfig) {
    switch (config.sectionType) {
      case 'year': {
        return this.placeholderGetters.year({
          digitAmount: this.adapter.formatByString(this.adapter.now('default'), tokenValue).length,
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

  private parse(expandedFormat: string, escapedParts: FormatEscapedParts) {
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

          tokens.push(this.createToken(firstWord));
          prefix = separator;
          separator = '';
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
