import { createSelector, createSelectorMemoized } from '@base-ui/utils/store';
import { TemporalSupportedValue } from '../../../types';
import { FormatParser } from './formatParser';
import { selectors } from './selectors';
import { TemporalFieldStore } from './TemporalFieldStore';
import {
  TemporalFieldCharacterEditingQuery,
  TemporalFieldSection,
  TemporalFieldToken,
  TemporalFieldState as State,
} from './types';
import {
  applyLocalizedDigits,
  cleanDigitSectionValue,
  getDaysInWeekStr,
  getLetterEditingOptions,
  isStringNumber,
  removeLocalizedDigits,
} from './utils';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';

const characterEditingSelectors = {
  characterQuery: createSelector((state: State) => state.characterQuery),
};

/**
 * Plugin to update the value of a section when pressing a digit or letter key.
 */
export class TemporalFieldCharacterEditingPlugin<TValue extends TemporalSupportedValue> {
  private store: TemporalFieldStore<TValue, any, any>;

  public static selectors = characterEditingSelectors;

  // We can't type `store`, otherwise we get the following TS error:
  // 'characterEditing' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;

    // Whenever the sections change, we need to clear the character query if the section type at the queried index has changed
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

    this.store.section.updateValue({
      sectionIndex,
      newSectionValue: response.sectionValue,
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
        sectionValue: matchingValues[0],
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
        getLetterEditingOptions(adapter, timezone, token.config.sectionType, format);

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
          sectionValue: formatFallbackValue(response.sectionValue, fallbackOptions),
        };
      }

      return { saveQuery: false };
    };

    const getFirstSectionValueMatchingWithQuery: QueryApplier = (queryValue, section) => {
      switch (section.token.config.sectionType) {
        case 'month': {
          const formatFallbackValue = (fallbackValue: string) =>
            this.getSectionValueInForAnotherToken(
              fallbackValue,
              adapter.formats.monthFullLetter,
              section.token.value,
            );

          return testQueryOnFormatAndFallbackFormat(
            queryValue,
            section.token,
            adapter.formats.monthFullLetter,
            formatFallbackValue,
          );
        }

        case 'weekDay': {
          const formatFallbackValue = (fallbackValue: string, fallbackOptions: string[]) =>
            fallbackOptions.indexOf(fallbackValue).toString();

          return testQueryOnFormatAndFallbackFormat(
            queryValue,
            section.token,
            adapter.formats.weekday,
            formatFallbackValue,
          );
        }

        case 'meridiem': {
          return testQueryOnFormatAndFallbackFormat(queryValue, section.token);
        }

        default: {
          return { saveQuery: false };
        }
      }
    };

    return this.applyQuery(parameters, getFirstSectionValueMatchingWithQuery);
  }

  private applyNumericEditing(parameters: EditSectionParameters) {
    const adapter = selectors.adapter(this.store.state);
    const localizedDigits = selectors.localizedDigits(this.store.state);

    const getNewSectionValue = ({
      queryValue,
      skipIfBelowMinimum,
      section,
    }: {
      queryValue: string;
      skipIfBelowMinimum: boolean;
      section: TemporalFieldSection;
    }): ReturnType<QueryApplier> => {
      const cleanQueryValue = removeLocalizedDigits(queryValue, localizedDigits);
      const queryValueNumber = Number(cleanQueryValue);
      const sectionBoundaries = TemporalFieldSectionPlugin.selectors.sectionBoundaries(
        this.store.state,
        section,
      );

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
        section.token,
      );

      return { sectionValue: newSectionValue, shouldGoToNextSection };
    };

    const getFirstSectionValueMatchingWithQuery: QueryApplier = (queryValue, section) => {
      if (
        section.token.config.contentType === 'digit' ||
        section.token.config.contentType === 'digit-with-letter'
      ) {
        return getNewSectionValue({
          queryValue,
          skipIfBelowMinimum: false,
          section,
        });
      }

      // When editing a letter-format month and the user presses a digit,
      // We can support the numeric editing by using the digit-format month and re-formatting the result.
      if (section.token.config.sectionType === 'month') {
        const response = getNewSectionValue({
          queryValue,
          skipIfBelowMinimum: true,
          section: {
            ...section,
            token: FormatParser.buildSingleToken(adapter, 'MM'),
          },
        });

        if (isQueryResponseWithoutValue(response)) {
          return response;
        }

        const formattedValue = this.getSectionValueInForAnotherToken(
          response.sectionValue,
          'MM',
          section.token.value,
        );

        return {
          ...response,
          sectionValue: formattedValue,
        };
      }

      // When editing a letter-format weekDay and the user presses a digit,
      // We can support the numeric editing by returning the nth day in the week day array.
      if (section.token.config.sectionType === 'weekDay') {
        const response = getNewSectionValue({
          queryValue,
          skipIfBelowMinimum: true,
          section,
        });
        if (isQueryResponseWithoutValue(response)) {
          return response;
        }

        const formattedValue = getDaysInWeekStr(adapter, section.token.value)[
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
    getFirstSectionValueMatchingWithQuery: QueryApplier,
    isValidQueryValue?: (queryValue: string) => boolean,
  ) {
    const { keyPressed, sectionIndex } = parameters;
    const cleanKeyPressed = keyPressed.toLowerCase();
    const characterQuery = characterEditingSelectors.characterQuery(this.store.state);
    const section = TemporalFieldSectionPlugin.selectors.section(this.store.state, sectionIndex);

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
          sectionType: section.token.config.sectionType,
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
      sectionType: section.token.config.sectionType,
    });

    if (isQueryResponseWithoutValue(queryResponse)) {
      return null;
    }

    return queryResponse;
  }

  private setCharacterQuery(characterQuery: TemporalFieldCharacterEditingQuery | null) {
    this.store.set('characterQuery', characterQuery);
  }

  private getSectionValueInForAnotherToken(
    valueStr: string,
    currentFormat: string,
    newFormat: string,
  ) {
    const adapter = selectors.adapter(this.store.state);
    const timezone = selectors.timezoneToRender(this.store.state);

    if (process.env.NODE_ENV !== 'production') {
      if (FormatParser.getTokenConfig(adapter, currentFormat).sectionType === 'weekDay') {
        throw new Error("getSectionValueInForAnotherToken doesn't support week day formats");
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
    TemporalFieldSectionPlugin.selectors.activeSection,
    (characterQuery, sections, activeSection) => ({ characterQuery, sections, activeSection }),
  );

  store.registerStoreEffect(selector, (_, { characterQuery, sections, activeSection }) => {
    if (characterQuery == null) {
      return;
    }
    const shouldReset =
      sections[characterQuery.sectionIndex]?.token.config.sectionType !==
        characterQuery.sectionType || activeSection == null; /* && error != null */ // TODO: Support error state

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
type QueryApplier = (
  queryValue: string,
  section: TemporalFieldSection,
) => { sectionValue: string; shouldGoToNextSection: boolean } | { saveQuery: boolean };
