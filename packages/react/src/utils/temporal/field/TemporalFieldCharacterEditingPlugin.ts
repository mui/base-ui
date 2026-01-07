import { TemporalSupportedValue } from '../../../types';
import { selectors } from './selectors';
import { TemporalFieldStore } from './TemporalFieldStore';
import {
  TemporalFieldCharacterEditingQuery,
  TemporalFieldNonRangeSection,
  TemporalFieldSection,
} from './types';
import {
  applyLocalizedDigits,
  cleanDigitSectionValue,
  doesSectionFormatHaveLeadingZeros,
  getDateSectionConfigFromFormatToken,
  getDaysInWeekStr,
  getLetterEditingOptions,
  isStringNumber,
  removeLocalizedDigits,
} from './utils';

/**
 * Plugin to update the value of a section when pressing a digit or letter key.
 */
export class TemporalFieldValueAdjustmentPlugin<TValue extends TemporalSupportedValue> {
  private store: TemporalFieldStore<TValue, any>;

  // We can't type `store`, otherwise we get the following TS error:
  // 'characterEditing' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  public resetCharacterQuery() {
    this.setCharacterQuery(null);
  }

  public editSection(parameters: EditSectionParameters) {
    const { keyPressed, sectionIndex } = parameters;
    const { localizedDigits } = this.store.state;
    const section = selectors.section<TValue>(this.store.state, sectionIndex);
    const isNumericEditing = isStringNumber(keyPressed, localizedDigits);
    const response = isNumericEditing
      ? applyNumericEditing({
          ...params,
          keyPressed: applyLocalizedDigits(keyPressed, localizedDigits),
        })
      : this.applyLetterEditing(parameters);
    if (response == null) {
      setTempAndroidValueStr(null);
      return;
    }

    this.store.updateSectionValue({
      section,
      newSectionValue: response.sectionValue,
      shouldGoToNextSection: response.shouldGoToNextSection,
    });
  }

  private applyLetterEditing(parameters: EditSectionParameters) {
    const { adapter } = this.store.state;
    const timezone = selectors.timezoneToRender(this.store.state);

    const findMatchingOptions = (
      format: string,
      options: string[],
      queryValue: string,
    ): ReturnType<QueryApplier<TValue>> => {
      const matchingValues = options.filter((option) =>
        option.toLowerCase().startsWith(queryValue),
      );

      if (matchingValues.length === 0) {
        return { saveQuery: false };
      }

      return {
        sectionValue: matchingValues[0],
        shouldGoToNextSection: matchingValues.length === 1,
      };
    };

    const testQueryOnFormatAndFallbackFormat = (
      queryValue: string,
      section: TemporalFieldSection<TValue>,
      fallbackFormat?: string,
      formatFallbackValue?: (fallbackValue: string, fallbackOptions: string[]) => string,
    ) => {
      const getOptions = (format: string) =>
        getLetterEditingOptions(adapter, timezone, section.sectionType, format);

      if (section.contentType === 'letter') {
        return findMatchingOptions(section.format, getOptions(section.format), queryValue);
      }

      // When editing a digit-format month / weekDay and the user presses a letter,
      // We can support the letter editing by using the letter-format month / weekDay and re-formatting the result.
      // We just have to make sure that the default month / weekDay format is a letter format,
      if (
        fallbackFormat &&
        formatFallbackValue != null &&
        getDateSectionConfigFromFormatToken(adapter, fallbackFormat).contentType === 'letter'
      ) {
        const fallbackOptions = getOptions(fallbackFormat);
        const response = findMatchingOptions(fallbackFormat, fallbackOptions, queryValue);
        if (isQueryResponseWithoutValue(response)) {
          return { saveQuery: false };
        }

        return {
          ...response,
          sectionValue: formatFallbackValue(response.sectionValue, fallbackOptions),
        };
      }

      return { saveQuery: false };
    };

    const getFirstSectionValueMatchingWithQuery: QueryApplier<TValue> = (queryValue, section) => {
      switch (section.sectionType) {
        case 'month': {
          const formatFallbackValue = (fallbackValue: string) =>
            this.getSectionValueInAnotherFormat(
              fallbackValue,
              adapter.formats.month,
              section.format,
            );

          return testQueryOnFormatAndFallbackFormat(
            queryValue,
            section,
            adapter.formats.month,
            formatFallbackValue,
          );
        }

        case 'weekDay': {
          const formatFallbackValue = (fallbackValue: string, fallbackOptions: string[]) =>
            fallbackOptions.indexOf(fallbackValue).toString();

          return testQueryOnFormatAndFallbackFormat(
            queryValue,
            section,
            adapter.formats.weekday,
            formatFallbackValue,
          );
        }

        case 'meridiem': {
          return testQueryOnFormatAndFallbackFormat(queryValue, section);
        }

        default: {
          return { saveQuery: false };
        }
      }
    };

    return this.applyQuery(parameters, getFirstSectionValueMatchingWithQuery);
  }

  private applyNumericEditing(parameters: EditSectionParameters) {
    const { adapter, localizedDigits } = this.store.state;

    const getNewSectionValue = ({
      queryValue,
      skipIfBelowMinimum,
      section,
    }: {
      queryValue: string;
      skipIfBelowMinimum: boolean;
      section: Pick<
        TemporalFieldNonRangeSection,
        | 'format'
        | 'sectionType'
        | 'contentType'
        | 'hasLeadingZerosInFormat'
        | 'hasLeadingZerosInInput'
        | 'maxLength'
      >;
    }): ReturnType<QueryApplier<TValue>> => {
      const cleanQueryValue = removeLocalizedDigits(queryValue, localizedDigits);
      const queryValueNumber = Number(cleanQueryValue);
      const sectionBoundaries = sectionsValueBoundaries[section.sectionType]({
        currentDate: null,
        format: section.format,
        contentType: section.contentType,
      });

      if (queryValueNumber > sectionBoundaries.maximum) {
        return { saveQuery: false };
      }

      // If the user types `0` on a month section,
      // It is below the minimum, but we want to store the `0` in the query,
      // So that when he pressed `1`, it will store `01` and move to the next section.
      if (skipIfBelowMinimum && queryValueNumber < sectionBoundaries.minimum) {
        return { saveQuery: true };
      }

      const shouldGoToNextSection =
        queryValueNumber * 10 > sectionBoundaries.maximum ||
        cleanQueryValue.length === sectionBoundaries.maximum.toString().length;

      const newSectionValue = cleanDigitSectionValue(
        adapter,
        queryValueNumber,
        sectionBoundaries,
        localizedDigits,
        section,
      );

      return { sectionValue: newSectionValue, shouldGoToNextSection };
    };

    const getFirstSectionValueMatchingWithQuery: QueryApplier<TValue> = (queryValue, section) => {
      if (section.contentType === 'digit' || section.contentType === 'digit-with-letter') {
        return getNewSectionValue({
          queryValue,
          skipIfBelowMinimum: false,
          section,
        });
      }

      // When editing a letter-format month and the user presses a digit,
      // We can support the numeric editing by using the digit-format month and re-formatting the result.
      if (section.sectionType === 'month') {
        const hasLeadingZerosInFormat = doesSectionFormatHaveLeadingZeros(
          adapter,
          'digit',
          'month',
          'MM',
        );

        const response = getNewSectionValue({
          queryValue,
          skipIfBelowMinimum: true,
          section: {
            sectionType: section.sectionType,
            format: 'MM',
            hasLeadingZerosInFormat,
            hasLeadingZerosInInput: true,
            contentType: 'digit',
            maxLength: 2,
          },
        });

        if (isQueryResponseWithoutValue(response)) {
          return response;
        }

        const formattedValue = this.getSectionValueInAnotherFormat(
          response.sectionValue,
          'MM',
          section.format,
        );

        return {
          ...response,
          sectionValue: formattedValue,
        };
      }

      // When editing a letter-format weekDay and the user presses a digit,
      // We can support the numeric editing by returning the nth day in the week day array.
      if (section.sectionType === 'weekDay') {
        const response = getNewSectionValue({
          queryValue,
          skipIfBelowMinimum: true,
          section,
        });
        if (isQueryResponseWithoutValue(response)) {
          return response;
        }

        const formattedValue = getDaysInWeekStr(adapter, section.format)[
          Number(response.sectionValue) - 1
        ];
        return {
          ...response,
          sectionValue: formattedValue,
        };
      }

      return { saveQuery: false };
    };

    return this.applyQuery(
      { ...parameters, keyPressed: applyLocalizedDigits(parameters.keyPressed, localizedDigits) },
      getFirstSectionValueMatchingWithQuery,
      (queryValue) => isStringNumber(queryValue, localizedDigits),
    );
  }

  private applyQuery(
    parameters: EditSectionParameters,
    getFirstSectionValueMatchingWithQuery: QueryApplier<TValue>,
    isValidQueryValue?: (queryValue: string) => boolean,
  ) {
    const { keyPressed, sectionIndex } = parameters;
    const cleanKeyPressed = keyPressed.toLowerCase();

    const { characterQuery } = this.store.state;
    const section = selectors.section<TValue>(this.store.state, sectionIndex);

    if (section == null) {
      return null;
    }

    // The current query targets the section being editing
    // We can try to concatenate the value
    if (
      characterQuery != null &&
      (!isValidQueryValue || isValidQueryValue(characterQuery.value)) &&
      characterQuery.sectionIndex === sectionIndex
    ) {
      const concatenatedQueryValue = `${characterQuery.value}${cleanKeyPressed}`;

      const queryResponse = getFirstSectionValueMatchingWithQuery(concatenatedQueryValue, section);
      if (!isQueryResponseWithoutValue(queryResponse)) {
        this.setCharacterQuery({
          sectionIndex,
          value: concatenatedQueryValue,
          sectionType: section.sectionType,
        });
        return queryResponse;
      }
    }

    const queryResponse = getFirstSectionValueMatchingWithQuery(cleanKeyPressed, section);
    if (isQueryResponseWithoutValue(queryResponse) && !queryResponse.saveQuery) {
      this.resetCharacterQuery();
      return null;
    }

    this.setCharacterQuery({
      sectionIndex,
      value: cleanKeyPressed,
      sectionType: section.sectionType,
    });

    if (isQueryResponseWithoutValue(queryResponse)) {
      return null;
    }

    return queryResponse;
  }

  private setCharacterQuery(characterQuery: TemporalFieldCharacterEditingQuery | null) {
    this.store.set('characterQuery', characterQuery);
  }

  private getSectionValueInAnotherFormat(
    valueStr: string,
    currentFormat: string,
    newFormat: string,
  ) {
    const { adapter } = this.store.state;
    const timezone = selectors.timezoneToRender(this.store.state);

    if (process.env.NODE_ENV !== 'production') {
      if (getDateSectionConfigFromFormatToken(adapter, currentFormat).sectionType === 'weekDay') {
        throw new Error("changeSectionValueFormat doesn't support week day formats");
      }
    }

    return adapter.formatByString(adapter.parse(valueStr, currentFormat, timezone)!, newFormat);
  }
}

function isQueryResponseWithoutValue<TValue extends TemporalSupportedValue>(
  response: ReturnType<QueryApplier<TValue>>,
): response is { saveQuery: boolean } {
  return (response as { saveQuery: boolean }).saveQuery != null;
}

interface EditSectionParameters {
  keyPressed: string;
  sectionIndex: number;
}

/**
 * Function called by `applyQuery` which decides:
 * - what is the new section value ?
 * - should the query used to get this value be stored for the next key press ?
 *
 * If it returns `{ sectionValue: string; shouldGoToNextSection: boolean }`,
 * Then we store the query and update the section with the new value.
 *
 * If it returns `{ saveQuery: true` },
 * Then we store the query and don't update the section.
 *
 * If it returns `{ saveQuery: false },
 * Then we do nothing.
 */
type QueryApplier<TValue extends TemporalSupportedValue> = (
  queryValue: string,
  section: TemporalFieldSection<TValue>,
) => { sectionValue: string; shouldGoToNextSection: boolean } | { saveQuery: boolean };
