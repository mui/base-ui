import { TemporalAdapter, TemporalSupportedObject } from '../../../types';
import { PickersLocaleText } from '../../../locales';
import { TemporalFieldNonRangeSection } from './types';
import {
  applyLocalizedDigits,
  cleanLeadingZeros,
  doesSectionFormatHaveLeadingZeros,
  getDateSectionConfigFromFormatToken,
  removeLocalizedDigits,
} from './utils';

interface BuildSectionsFromFormatParameters {
  adapter: TemporalAdapter;
  format: string;
  isRtl: boolean;
  shouldRespectLeadingZeros: boolean;
  localeText: PickersLocaleText;
  localizedDigits: string[];
  date: TemporalSupportedObject | null;
}

type FormatEscapedParts = { start: number; end: number }[];

const expandFormat = ({ adapter, format }: BuildSectionsFromFormatParameters) => {
  // Expand the provided format
  let formatExpansionOverflow = 10;
  let prevFormat = format;
  let nextFormat = adapter.expandFormat(format);
  while (nextFormat !== prevFormat) {
    prevFormat = nextFormat;
    nextFormat = adapter.expandFormat(prevFormat);
    formatExpansionOverflow -= 1;
    if (formatExpansionOverflow < 0) {
      throw new Error(
        'MUI X: The format expansion seems to be in an infinite loop. Please open an issue with the format passed to the component.',
      );
    }
  }

  return nextFormat;
};

const getEscapedPartsFromFormat = ({
  adapter,
  expandedFormat,
}: BuildSectionsFromFormatParameters & { expandedFormat: string }) => {
  const escapedParts: FormatEscapedParts = [];
  const { start: startChar, end: endChar } = adapter.escapedCharacters;
  const regExp = new RegExp(`(\\${startChar}[^\\${endChar}]*\\${endChar})+`, 'g');

  let match: RegExpExecArray | null = null;
  // eslint-disable-next-line no-cond-assign
  while ((match = regExp.exec(expandedFormat))) {
    escapedParts.push({ start: match.index, end: regExp.lastIndex - 1 });
  }

  return escapedParts;
};

const getSectionPlaceholder = (
  adapter: TemporalAdapter,
  localeText: PickersLocaleText,
  sectionConfig: Pick<TemporalFieldNonRangeSection, 'sectionType' | 'contentType'>,
  sectionFormat: string,
) => {
  switch (sectionConfig.sectionType) {
    case 'year': {
      return localeText.fieldYearPlaceholder({
        digitAmount: adapter.formatByString(adapter.now('default'), sectionFormat).length,
        format: sectionFormat,
      });
    }

    case 'month': {
      return localeText.fieldMonthPlaceholder({
        contentType: sectionConfig.contentType,
        format: sectionFormat,
      });
    }

    case 'day': {
      return localeText.fieldDayPlaceholder({ format: sectionFormat });
    }

    case 'weekDay': {
      return localeText.fieldWeekDayPlaceholder({
        contentType: sectionConfig.contentType,
        format: sectionFormat,
      });
    }

    case 'hours': {
      return localeText.fieldHoursPlaceholder({ format: sectionFormat });
    }

    case 'minutes': {
      return localeText.fieldMinutesPlaceholder({ format: sectionFormat });
    }

    case 'seconds': {
      return localeText.fieldSecondsPlaceholder({ format: sectionFormat });
    }

    case 'meridiem': {
      return localeText.fieldMeridiemPlaceholder({ format: sectionFormat });
    }

    default: {
      return sectionFormat;
    }
  }
};

const createSection = ({
  adapter,
  date,
  shouldRespectLeadingZeros,
  localeText,
  localizedDigits,
  now,
  token,
  startSeparator,
}: BuildSectionsFromFormatParameters & {
  now: TemporalSupportedObject;
  token: string;
  startSeparator: string;
}): TemporalFieldNonRangeSection => {
  if (token === '') {
    throw new Error('MUI X: Should not call `commitToken` with an empty token');
  }

  const sectionConfig = getDateSectionConfigFromFormatToken(adapter, token);

  const hasLeadingZerosInFormat = doesSectionFormatHaveLeadingZeros(
    adapter,
    sectionConfig.contentType,
    sectionConfig.sectionType,
    token,
  );

  const hasLeadingZerosInInput = shouldRespectLeadingZeros
    ? hasLeadingZerosInFormat
    : sectionConfig.contentType === 'digit';

  const isValidDate = adapter.isValid(date);
  let sectionValue = isValidDate ? adapter.formatByString(date, token) : '';
  let maxLength: number | undefined = undefined;

  if (hasLeadingZerosInInput) {
    if (hasLeadingZerosInFormat) {
      maxLength =
        sectionValue === '' ? adapter.formatByString(now, token).length : sectionValue.length;
    } else {
      if (sectionConfig.maxLength == null) {
        throw new Error(
          `MUI X: The token ${token} should have a 'maxLength' property on it's adapter`,
        );
      }

      maxLength = sectionConfig.maxLength;

      if (isValidDate) {
        sectionValue = applyLocalizedDigits(
          cleanLeadingZeros(removeLocalizedDigits(sectionValue, localizedDigits), maxLength),
          localizedDigits,
        );
      }
    }
  }

  return {
    ...sectionConfig,
    format: token,
    maxLength,
    value: sectionValue,
    placeholder: getSectionPlaceholder(adapter, localeText, sectionConfig, token),
    hasLeadingZerosInFormat,
    hasLeadingZerosInInput,
    startSeparator,
    endSeparator: '',
    modified: false,
  };
};

const buildSections = (
  parameters: BuildSectionsFromFormatParameters & {
    expandedFormat: string;
    escapedParts: FormatEscapedParts;
  },
) => {
  const { adapter, expandedFormat, escapedParts } = parameters;

  const now = adapter.now('default');
  const sections: TemporalFieldNonRangeSection[] = [];
  let startSeparator: string = '';

  // This RegExp tests if the beginning of a string corresponds to a supported token
  const validTokens = Object.keys(adapter.formatTokenConfigMap).sort((a, b) => b.length - a.length); // Sort to put longest word first

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
    // We extract those tokens to create a new sections.
    if (
      !isEscapedChar &&
      firstWordInFormat != null &&
      regExpWordOnlyComposedOfTokens.test(firstWordInFormat)
    ) {
      let word = firstWordInFormat;
      while (word.length > 0) {
        const firstWord = regExpFirstTokenInWord.exec(word)![1];
        word = word.slice(firstWord.length);
        sections.push(createSection({ ...parameters, now, token: firstWord, startSeparator }));
        startSeparator = '';
      }

      i += firstWordInFormat.length;
    }
    // The remaining format does not start with a token,
    // We take the first character and add it to the current section's end separator.
    else {
      const char = expandedFormat[i];

      // If we are on the opening or closing character of an escaped part of the format,
      // Then we ignore this character.
      const isEscapeBoundary =
        (isEscapedChar && escapedPartOfCurrentChar?.start === i) ||
        escapedPartOfCurrentChar?.end === i;

      if (!isEscapeBoundary) {
        if (sections.length === 0) {
          startSeparator += char;
        } else {
          sections[sections.length - 1].endSeparator += char;
          sections[sections.length - 1].isEndFormatSeparator = true;
        }
      }

      i += 1;
    }
  }

  if (sections.length === 0 && startSeparator.length > 0) {
    sections.push({
      sectionType: 'empty',
      contentType: 'letter',
      maxLength: undefined,
      format: '',
      value: '',
      placeholder: '',
      hasLeadingZerosInFormat: false,
      hasLeadingZerosInInput: false,
      startSeparator,
      endSeparator: '',
      modified: false,
    });
  }

  return sections;
};

const postProcessSections = ({
  isRtl,
  sections,
}: BuildSectionsFromFormatParameters & {
  sections: TemporalFieldNonRangeSection[];
}) => {
  return sections.map((section) => {
    const cleanSeparator = (separator: string) => {
      let cleanedSeparator = separator;
      if (isRtl && cleanedSeparator !== null && cleanedSeparator.includes(' ')) {
        cleanedSeparator = `\u2069${cleanedSeparator}\u2066`;
      }

      return cleanedSeparator;
    };

    section.startSeparator = cleanSeparator(section.startSeparator);
    section.endSeparator = cleanSeparator(section.endSeparator);

    return section;
  });
};

export const buildSectionsFromFormat = (parameters: BuildSectionsFromFormatParameters) => {
  let expandedFormat = expandFormat(parameters);
  if (parameters.isRtl) {
    expandedFormat = expandedFormat.split(' ').reverse().join(' ');
  }

  const escapedParts = getEscapedPartsFromFormat({ ...parameters, expandedFormat });
  const sections = buildSections({ ...parameters, expandedFormat, escapedParts });

  return postProcessSections({ ...parameters, sections });
};
