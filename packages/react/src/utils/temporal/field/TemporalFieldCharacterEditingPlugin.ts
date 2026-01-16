import { createSelector, createSelectorMemoized } from '@base-ui/utils/store';
import { TemporalSupportedValue } from '../../../types';
import { FormatParser } from './formatParser';
import { selectors } from './selectors';
import { TemporalFieldStore } from './TemporalFieldStore';
import {
  TemporalFieldCharacterEditingQuery,
  TemporalFieldToken,
  TemporalFieldState as State,
  TemporalFieldDatePart,
} from './types';
import {
  applyLocalizedDigits,
  cleanDigitDatePartValue,
  getDaysInWeekStr,
  getLetterEditingOptions,
  isDatePart,
  isStringNumber,
  removeLocalizedDigits,
} from './utils';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';

const characterEditingSelectors = {
  characterQuery: createSelector((state: State) => state.characterQuery),
};

/**
 * Plugin to update the value of a date part when pressing a digit or letter key.
 */
export class TemporalFieldCharacterEditingPlugin<TValue extends TemporalSupportedValue> {
  private store: TemporalFieldStore<TValue, any, any>;

  public static selectors = characterEditingSelectors;

  // We can't type `store`, otherwise we get the following TS error:
  // 'characterEditing' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;

    // Whenever the sections change, we need to clear the character query if the date part type at the queried index has changed
    syncCharacterQueryWithSections(store);
  }

  public resetCharacterQuery() {
    this.setCharacterQuery(null);
  }

  public editSection(parameters: EditSectionParameters) {
    const { keyPressed, sectionIndex } = parameters;
    const localizedDigits = selectors.localizedDigits(this.store.state);
    const response = isStringNumber(keyPressed, localizedDigits)
      ? this.applyNumericEditing(parameters)
      : this.applyLetterEditing(parameters);
    if (response == null) {
      return;
    }

    this.store.section.updateDatePart({
      sectionIndex,
      newDatePartValue: response.datePartValue,
      shouldGoToNextSection: response.shouldGoToNextSection,
    });
  }

  private applyLetterEditing(parameters: EditSectionParameters) {
    const adapter = selectors.adapter(this.store.state);
    const timezone = selectors.timezoneToRender(this.store.state);

    const findMatchingOptions = (
      format: string,
      options: string[],
      queryValue: string,
    ): ReturnType<QueryApplier> => {
      const matchingValues = options.filter((option) =>
        option.toLowerCase().startsWith(queryValue),
      );

      if (matchingValues.length === 0) {
        return { saveQuery: false };
      }

      return {
        datePartValue: matchingValues[0],
        shouldGoToNextSection: matchingValues.length === 1,
      };
    };

    const testQueryOnFormatAndFallbackFormat = (
      queryValue: string,
      token: TemporalFieldToken,
      fallbackFormat?: string,
      formatFallbackValue?: (fallbackValue: string, fallbackOptions: string[]) => string,
    ) => {
      const getOptions = (format: string) =>
        getLetterEditingOptions(adapter, timezone, token.config.part, format);

      if (token.config.contentType === 'letter') {
        return findMatchingOptions(token.value, getOptions(token.value), queryValue);
      }

      // When editing a digit-format month / weekDay and the user presses a letter,
      // We can support the letter editing by using the letter-format month / weekDay and re-formatting the result.
      // We just have to make sure that the default month / weekDay format is a letter format,
      if (
        fallbackFormat &&
        formatFallbackValue != null &&
        FormatParser.getTokenConfig(adapter, fallbackFormat).contentType === 'letter'
      ) {
        const fallbackOptions = getOptions(fallbackFormat);
        const response = findMatchingOptions(fallbackFormat, fallbackOptions, queryValue);
        if (isQueryResponseWithoutValue(response)) {
          return { saveQuery: false };
        }

        return {
          ...response,
          datePartValue: formatFallbackValue(response.datePartValue, fallbackOptions),
        };
      }

      return { saveQuery: false };
    };

    const getFirstDatePartValueMatchingWithQuery: QueryApplier = (queryValue, datePart) => {
      switch (datePart.token.config.part) {
        case 'month': {
          const formatFallbackValue = (fallbackValue: string) =>
            this.getDatePartValueInForAnotherToken(
              fallbackValue,
              adapter.formats.monthFullLetter,
              datePart.token.value,
            );

          return testQueryOnFormatAndFallbackFormat(
            queryValue,
            datePart.token,
            adapter.formats.monthFullLetter,
            formatFallbackValue,
          );
        }

        case 'weekDay': {
          const formatFallbackValue = (fallbackValue: string, fallbackOptions: string[]) =>
            fallbackOptions.indexOf(fallbackValue).toString();

          return testQueryOnFormatAndFallbackFormat(
            queryValue,
            datePart.token,
            adapter.formats.weekday,
            formatFallbackValue,
          );
        }

        case 'meridiem': {
          return testQueryOnFormatAndFallbackFormat(queryValue, datePart.token);
        }

        default: {
          return { saveQuery: false };
        }
      }
    };

    return this.applyQuery(parameters, getFirstDatePartValueMatchingWithQuery);
  }

  private applyNumericEditing(parameters: EditSectionParameters) {
    const adapter = selectors.adapter(this.store.state);
    const localizedDigits = selectors.localizedDigits(this.store.state);

    const getNewDatePartValue = ({
      queryValue,
      skipIfBelowMinimum,
      datePart,
    }: {
      queryValue: string;
      skipIfBelowMinimum: boolean;
      datePart: TemporalFieldDatePart;
    }): ReturnType<QueryApplier> => {
      const cleanQueryValue = removeLocalizedDigits(queryValue, localizedDigits);
      const queryValueNumber = Number(cleanQueryValue);
      const boundaries = TemporalFieldSectionPlugin.selectors.datePartBoundaries(
        this.store.state,
        datePart,
      );

      if (queryValueNumber > boundaries.maximum) {
        return { saveQuery: false };
      }

      // If the user types `0` on a month part,
      // It is below the minimum, but we want to store the `0` in the query,
      // So that when he pressed `1`, it will store `01` and move to the next part.
      if (skipIfBelowMinimum && queryValueNumber < boundaries.minimum) {
        return { saveQuery: true };
      }

      const shouldGoToNextSection =
        queryValueNumber * 10 > boundaries.maximum ||
        cleanQueryValue.length === boundaries.maximum.toString().length;

      const newDatePartValue = cleanDigitDatePartValue(
        adapter,
        queryValueNumber,
        boundaries,
        localizedDigits,
        datePart.token,
      );

      return { datePartValue: newDatePartValue, shouldGoToNextSection };
    };

    const getFirstDatePartValueMatchingWithQuery: QueryApplier = (queryValue, datePart) => {
      if (
        datePart.token.config.contentType === 'digit' ||
        datePart.token.config.contentType === 'digit-with-letter'
      ) {
        return getNewDatePartValue({
          queryValue,
          skipIfBelowMinimum: true,
          datePart,
        });
      }

      // When editing a letter-format month and the user presses a digit,
      // We can support the numeric editing by using the digit-format month and re-formatting the result.
      if (datePart.token.config.part === 'month') {
        const response = getNewDatePartValue({
          queryValue,
          skipIfBelowMinimum: true,
          datePart: {
            ...datePart,
            token: FormatParser.buildSingleToken(adapter, 'MM'),
          },
        });

        if (isQueryResponseWithoutValue(response)) {
          return response;
        }

        const formattedValue = this.getDatePartValueInForAnotherToken(
          response.datePartValue,
          'MM',
          datePart.token.value,
        );

        return {
          ...response,
          datePartValue: formattedValue,
        };
      }

      // When editing a letter-format weekDay and the user presses a digit,
      // We can support the numeric editing by returning the nth day in the week day array.
      if (datePart.token.config.part === 'weekDay') {
        const response = getNewDatePartValue({
          queryValue,
          skipIfBelowMinimum: true,
          datePart,
        });
        if (isQueryResponseWithoutValue(response)) {
          return response;
        }

        const formattedValue = getDaysInWeekStr(adapter, datePart.token.value)[
          Number(response.datePartValue) - 1
        ];
        return {
          ...response,
          datePartValue: formattedValue,
        };
      }

      return { saveQuery: false };
    };

    return this.applyQuery(
      { ...parameters, keyPressed: applyLocalizedDigits(parameters.keyPressed, localizedDigits) },
      getFirstDatePartValueMatchingWithQuery,
      (queryValue) => isStringNumber(queryValue, localizedDigits),
    );
  }

  private applyQuery(
    parameters: EditSectionParameters,
    getFirstDatePartValueMatchingWithQuery: QueryApplier,
    isValidQueryValue?: (queryValue: string) => boolean,
  ) {
    const { keyPressed, sectionIndex } = parameters;
    const cleanKeyPressed = keyPressed.toLowerCase();
    const characterQuery = characterEditingSelectors.characterQuery(this.store.state);
    const datePart = TemporalFieldSectionPlugin.selectors.datePart(this.store.state, sectionIndex);

    if (datePart == null) {
      return null;
    }

    // The current query targets the date part being editing
    // We can try to concatenate the value
    if (
      characterQuery != null &&
      (!isValidQueryValue || isValidQueryValue(characterQuery.value)) &&
      characterQuery.sectionIndex === sectionIndex
    ) {
      const concatenatedQueryValue = `${characterQuery.value}${cleanKeyPressed}`;

      const queryResponse = getFirstDatePartValueMatchingWithQuery(
        concatenatedQueryValue,
        datePart,
      );
      if (!isQueryResponseWithoutValue(queryResponse)) {
        this.setCharacterQuery({
          sectionIndex,
          value: concatenatedQueryValue,
          part: datePart.token.config.part,
        });
        return queryResponse;
      }

      // Concatenation failed
      // For numeric editing: Check if the concatenated value was valid format (e.g., '15' is a valid number)
      //   but failed due to boundary validation. If so, reject the input and keep current value.
      // For letter editing: Check if we have an existing value in the datePart.
      //   If so, keep it and reject the new input.
      if (
        (isValidQueryValue && isValidQueryValue(concatenatedQueryValue)) ||
        (!isValidQueryValue && datePart.value !== '')
      ) {
        // Reject the input, keep current value, and reset query
        this.resetCharacterQuery();
        return null;
      }

      // If concatenated value was invalid AND there's no existing value to preserve,
      // reset query and try starting a new query with the new key
      this.resetCharacterQuery();
    }

    const queryResponse = getFirstDatePartValueMatchingWithQuery(cleanKeyPressed, datePart);
    if (isQueryResponseWithoutValue(queryResponse) && !queryResponse.saveQuery) {
      this.resetCharacterQuery();
      return null;
    }

    this.setCharacterQuery({
      sectionIndex,
      value: cleanKeyPressed,
      part: datePart.token.config.part,
    });

    if (isQueryResponseWithoutValue(queryResponse)) {
      return null;
    }

    return queryResponse;
  }

  private setCharacterQuery(characterQuery: TemporalFieldCharacterEditingQuery | null) {
    this.store.set('characterQuery', characterQuery);
  }

  private getDatePartValueInForAnotherToken(
    valueStr: string,
    currentFormat: string,
    newFormat: string,
  ) {
    const adapter = selectors.adapter(this.store.state);
    const timezone = selectors.timezoneToRender(this.store.state);

    if (process.env.NODE_ENV !== 'production') {
      if (FormatParser.getTokenConfig(adapter, currentFormat).part === 'weekDay') {
        throw new Error("getDatePartValueInForAnotherToken doesn't support week day formats");
      }
    }

    return adapter.formatByString(adapter.parse(valueStr, currentFormat, timezone)!, newFormat);
  }
}

function isQueryResponseWithoutValue(
  response: ReturnType<QueryApplier>,
): response is { saveQuery: boolean } {
  return (response as { saveQuery: boolean }).saveQuery != null;
}

function syncCharacterQueryWithSections<TValue extends TemporalSupportedValue>(
  store: TemporalFieldStore<TValue, any, any>,
) {
  const selector = createSelectorMemoized(
    characterEditingSelectors.characterQuery,
    TemporalFieldSectionPlugin.selectors.sections,
    TemporalFieldSectionPlugin.selectors.activeDatePart,
    (characterQuery, sections, activeSection) => ({ characterQuery, sections, activeSection }),
  );

  store.registerStoreEffect(selector, (_, { characterQuery, sections, activeSection }) => {
    if (characterQuery == null) {
      return;
    }

    const querySection = sections[characterQuery.sectionIndex];

    const shouldReset =
      (isDatePart(querySection) && querySection.token.config.part !== characterQuery.part) ||
      activeSection == null; /* && error != null */ // TODO: Support error state

    if (shouldReset) {
      store.set('characterQuery', null);
    }
  });
}

interface EditSectionParameters {
  keyPressed: string;
  sectionIndex: number;
}

/**
 * Function called by `applyQuery` which decides:
 * - what is the new date part value ?
 * - should the query used to get this value be stored for the next key press ?
 *
 * If it returns `{ datePartValue: string; shouldGoToNextSection: boolean }`,
 * Then we store the query and update the date part with the new value.
 *
 * If it returns `{ saveQuery: true` },
 * Then we store the query and don't update the date part.
 *
 * If it returns `{ saveQuery: false },
 * Then we do nothing.
 */
type QueryApplier = (
  queryValue: string,
  datePart: TemporalFieldDatePart,
) => { datePartValue: string; shouldGoToNextSection: boolean } | { saveQuery: boolean };
