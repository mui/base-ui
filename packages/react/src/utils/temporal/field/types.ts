import { TextDirection } from '../../../direction-provider';
import {
  BaseUIChangeEventDetails,
  TemporalAdapter,
  TemporalFieldSectionContentType,
  TemporalFieldSectionType,
  TemporalFormatTokenConfig,
  TemporalNonNullableValue,
  TemporalSupportedObject,
  TemporalSupportedValue,
  TemporalTimezone,
} from '../../../types';
import { GetInitialReferenceDateValidationProps } from '../getInitialReferenceDate';
import { TemporalManager, TemporalTimezoneProps } from '../types';

export interface TemporalFieldStoreParameters<
  TValue extends TemporalSupportedValue,
  TError,
> extends TemporalTimezoneProps {
  /**
   * The controlled value that should be selected.
   * To render an uncontrolled temporal field, use the `defaultValue` prop instead.
   */
  value?: TValue;
  /**
   * The uncontrolled value that should be initially selected.
   * To render a controlled temporal field, use the `value` prop instead.
   */
  defaultValue?: TValue;
  /**
   * Event handler called when the selected value changes.
   * Provides the new value as an argument.
   * Has `getValidationError()` in the `eventDetails` to retrieve the validation error associated to the new value.
   */
  onValueChange?: (
    value: TValue,
    eventDetails: TemporalFieldValueChangeEventDetails<TError>,
  ) => void;
  /**
   * The date used to generate the new value when both `value` and `defaultValue` are empty.
   * @default 'The closest valid date using the validation props.'
   */
  referenceDate?: TemporalSupportedObject;
  /**
   * Format of the date when rendered in the field.
   */
  format: string;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether the user should be unable to select a date in the field.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Whether the field is forcefully marked as invalid.
   */
  invalid?: boolean;
  /**
   * Methods to generate the placeholders for each section type.
   * Used when the field is empty or when a section is empty.
   * If a section type is not specified, a default placeholder will be used.
   * @default {}
   */
  placeholderGetters?: TemporalFieldPlaceholderGetters;
}

export interface TemporalFieldState<
  TValue extends TemporalSupportedValue = any,
  TValidationProps extends object = object,
> {
  /**
   * The timezone as passed to `props.timezone`.
   */
  timezoneProp: TemporalTimezone | undefined;
  /**
   * The reference date as passed to `props.referenceDate`.
   */
  referenceDateProp: TemporalSupportedObject | null;
  /**
   * The manager of the field (uses `getDateManager` for DateField and `getTimeManager` for TimeField).
   * Not publicly exposed, is only set in state to avoid passing it to the selectors.
   */
  manager: TemporalManager<TValue, any, any>;
  /**
   * The value manager of the field.
   * Not publicly exposed, is only set in state to avoid passing it to the selectors.
   */
  valueManager: TemporalFieldValueManager<TValue>;
  /**
   * The adapter of the date library.
   * Not publicly exposed, is only set in state to avoid passing it to the selectors.
   */
  adapter: TemporalAdapter;
  /**
   * The current query when editing the field using letters or digits.
   */
  characterQuery: TemporalFieldCharacterEditingQuery | null;
  /**
   * Sections currently displayed in the field.
   */
  sections: TemporalFieldSection[];
  /**
   * Format of the date when rendered in the field.
   */
  format: string;
  /**
   * The value of the field, as passed to `props.value` or `props.defaultValue`.
   */
  value: TValue;
  /**
   * Text direction of the field.
   */
  direction: TextDirection;
  /**
   * The currently selected sections.
   * This prop accepts four formats:
   * - If a number is provided, the section at this index will be selected.
   * - If `"all"` is provided, all the sections will be selected.
   * - If `null` is provided, no section will be selected.
   */
  selectedSections: TemporalFieldSelectedSections;
  /**
   * Non-nullable value used to keep trace of the timezone and the date parts not present in the format.
   * It is updated whenever we have a valid date (for the Range Pickers we update only the portion of the range that is valid).
   */
  referenceValue: TemporalNonNullableValue<TValue>;
  /**
   * Whether the field is disabled.
   */
  disabled: boolean;
  /**
   * Whether the field is read-only.
   */
  readOnly: boolean;
  /**
   * Methods to generate the placeholders for each section type.
   */
  placeholderGetters: TemporalFieldPlaceholderGetters | undefined;
  /**
   * Props used to check the validity of a date.
   */
  validationProps: TValidationProps;
}

export interface TemporalFieldCharacterEditingQuery {
  value: string;
  sectionIndex: number;
  sectionType: TemporalFieldSectionType;
}

export type TemporalFieldChangeReason = 'none';

export interface TemporalFieldParsedFormat {
  prefix: string;
  suffix: string;
  tokens: TemporalFieldToken[];
}

export interface TemporalFieldToken {
  /**
   * Format token.
   */
  // TODO: Rename "value"
  tokenValue: string;
  /**
   * Config of the format token.
   */
  config: TemporalFormatTokenConfig;
  /**
   * Whether the value of this section should have leading zeroes when parsed by the date library.
   * For example, the value `1` should be rendered as "01" instead of "1".
   */
  isPadded: boolean;
  /**
   * Text to display when the section is empty.
   */
  placeholder: string;
  /**
   * Separator displayed after the value of the section in the input.
   * If it contains escaped characters, then it must not have the escaping characters.
   * For example, on Date Fns, the `month` section of the format `MM/DD/YYYY` has an end separator equal to `year`.
   *
   * The separator does not contain the character before the first section and after the last section.
   * For example, on Date Fns, the separators of the format `[Before] MM/DD/YYYY [After]` are:
   * - "/" for the month section
   * - "/" for the day section
   * - "" for the year section
   */
  separator: string;
}

export interface TemporalFieldSection {
  /**
   * Value of the section, as rendered inside the input.
   * For example, in the date `May 25, 1995`, the value of the month section is "May".
   */
  value: string;
  /**
   * If `true`, the section value has been modified since the last time the sections were generated from a valid date.
   * When we can generate a valid date from the section, we don't directly pass it to `onChange`,
   * Otherwise, we would lose all the information contained in the original date, things like:
   * - time if the format does not contain it
   * - timezone / UTC
   *
   * To avoid losing that information, we transfer the values of the modified sections from the newly generated date to the original date.
   */
  modified: boolean;
  /**
   * Token represented in this section.
   */
  token: TemporalFieldToken;
  /**
   * Index of the section in the section list.
   */
  index: number;
}

export type TemporalFieldRangePosition = 'start' | 'end';

export type TemporalFieldSelectedSections = number | null | 'all';

export interface TemporalFieldValueChangeHandlerContext<TError> {
  /**
   * The validation error associated to the new value.
   */
  getValidationError: () => TError;
}

export type TemporalFieldValueChangeEventDetails<TError> = BaseUIChangeEventDetails<
  TemporalFieldChangeReason,
  TemporalFieldValueChangeHandlerContext<TError>
>;

export interface TemporalFieldValueManager<TValue extends TemporalSupportedValue> {
  /**
   * Value to set when clearing the field.
   */
  emptyValue: TValue;
  /**
   * Determines if two values are equal.
   */
  areValuesEqual: (adapter: TemporalAdapter, valueLeft: TValue, valueRight: TValue) => boolean;
  /**
   * Creates the section list from the current value.
   * The `prevSections` are used on the range fields to avoid losing the sections of a partially filled date when editing the other date.
   */
  getSectionsFromValue: (
    value: TValue,
    getSectionsFromDate: (date: TemporalSupportedObject | null) => TemporalFieldSection[],
  ) => TemporalFieldSection[];
  /**
   * Parses a string version (most of the time coming from the input).
   * This method should only be used when the change does not come from a single section.
   */
  parseValueStr: (
    valueStr: string,
    referenceValue: TemporalNonNullableValue<TValue>,
    parseDate: (
      dateStr: string,
      referenceDate: TemporalSupportedObject,
    ) => TemporalSupportedObject | null,
  ) => TValue;
  /**
   * Creates a new value based on the provided date and the current value.
   */
  updateDateInValue: (
    value: TValue,
    section: TemporalFieldSection,
    date: TemporalSupportedObject | null,
  ) => TValue;
  /**
   * Extract from the given value the date that contains the given section.
   */
  getDateFromSection: (
    value: TValue,
    section: TemporalFieldSection,
  ) => TemporalSupportedObject | null;
  /**
   * Get the sections of the date that contains the given section.
   */
  getDateSectionsFromValue: (
    sections: TemporalFieldSection[],
    section: TemporalFieldSection,
  ) => TemporalFieldSection[];
  /**
   * Method returning the reference value to use when mounting the component.
   */
  getInitialReferenceValue: (params: {
    externalReferenceDate: TemporalSupportedObject | undefined;
    value: TValue;
    validationProps: GetInitialReferenceDateValidationProps;
    adapter: TemporalAdapter;
    granularity: number;
    timezone: TemporalTimezone;
    getTodayDate?: () => TemporalSupportedObject;
  }) => TemporalNonNullableValue<TValue>;
  /**
   * Clear all the sections representing the same date as the given section.
   */
  clearDateSections: (
    sections: TemporalFieldSection[],
    section: TemporalFieldSection,
  ) => TemporalFieldSection[];
}

export interface TemporalFieldPlaceholderGetters {
  year?: (params: { digitAmount: number; format: string }) => string;
  month?: (params: { contentType: TemporalFieldSectionContentType; format: string }) => string;
  day?: (params: { format: string }) => string;
  weekDay?: (params: { contentType: TemporalFieldSectionContentType; format: string }) => string;
  hours?: (params: { format: string }) => string;
  minutes?: (params: { format: string }) => string;
  seconds?: (params: { format: string }) => string;
  meridiem?: (params: { format: string }) => string;
}

export type TemporalFieldSectionValueBoundaries<SectionType extends TemporalFieldSectionType> = {
  minimum: number;
  maximum: number;
} & (SectionType extends 'day' ? { longestMonth: TemporalSupportedObject } : {});

export type TemporalFieldSectionValueBoundariesLookup = {
  [SectionType in TemporalFieldSectionType]: (params: {
    currentDate: TemporalSupportedObject | null;
    format: string;
    contentType: TemporalFieldSectionContentType;
  }) => TemporalFieldSectionValueBoundaries<SectionType>;
};

export type TemporalFieldModelUpdater<
  State extends TemporalFieldState<any, any>,
  Parameters extends TemporalFieldStoreParameters<any, any>,
> = (
  newState: Partial<State>,
  controlledProp: keyof Parameters & keyof State & string,
  defaultProp: keyof Parameters,
) => void;
