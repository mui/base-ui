import { FieldRootContext } from '../../../field/root/FieldRootContext';
import { TextDirection } from '../../../direction-provider';
import {
  BaseUIChangeEventDetails,
  TemporalAdapter,
  TemporalFieldSectionContentType,
  TemporalFormatTokenConfig,
  TemporalNonNullableValue,
  TemporalSupportedObject,
  TemporalSupportedValue,
  TemporalTimezone,
  TemporalFieldDatePartType,
} from '../../../types';
import { GetInitialReferenceDateValidationProps } from '../getInitialReferenceDate';
import { TemporalManager, TemporalTimezoneProps } from '../types';

/**
 * Parameters shared across all temporal field stores.
 */
export interface TemporalFieldStoreSharedParameters<
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
   * Whether the user must enter a value before submitting a form.
   * @default false
   */
  required?: boolean;
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
   * Identifies the field when a form is submitted.
   */
  name?: string;
  /**
   * The id of the hidden input element.
   */
  id?: string;
  /**
   * A ref to access the hidden input element.
   */
  inputRef?: React.Ref<HTMLInputElement>;
  /**
   * Methods to generate the placeholders for each section type.
   * Used when the field is empty or when a section is empty.
   * If a section type is not specified, a default placeholder will be used.
   * @default {}
   */
  placeholderGetters?: TemporalFieldPlaceholderGetters;
  /**
   * The field context from Field.Root.
   * Contains state, callbacks, validation, etc.
   * Used internally when the temporal field is rendered inside a Field component.
   */
  fieldContext?: any | null;
}

export interface TemporalFieldState<
  TValue extends TemporalSupportedValue = any,
  TError = any,
  TValidationProps extends object = any,
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
   * The value of the field, as passed to `props.value`.
   */
  valueProp: TValue | undefined;
  /**
   * The manager of the field (uses `getDateManager` for DateField and `getTimeManager` for TimeField).
   * Not publicly exposed, is only set in state to avoid passing it to the selectors.
   */
  manager: TemporalManager<TValue, any, any>;
  /**
   * The config of the field.
   * Not publicly exposed, is only set in state to avoid passing it to the selectors.
   */
  config: TemporalFieldConfiguration<TValue, TError, TValidationProps>;
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
   * A section represents either a part of the date (like year, month, day) or a separator (like `/`, `-`, etc.).
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
   * - If a number is provided, the section at this index will be selected.
   * - If `null` is provided, no section will be selected.
   */
  selectedSection: TemporalFieldSelectedSection;
  /**
   * Non-nullable value used to keep trace of the timezone and the date parts not present in the format.
   * It is updated whenever we have a valid date (for the Range Pickers we update only the portion of the range that is valid).
   */
  referenceValue: TemporalNonNullableValue<TValue>;
  /**
   * Whether the user must enter a value before submitting a form.
   */
  required: boolean;
  /**
   * Whether the component should ignore user interaction (from props).
   * When used inside a Field component, the actual disabled state is computed by combining this with fieldContext.state.disabled.
   */
  disabledProp: boolean;
  /**
   * Whether the user should be unable to select a date in the field.
   */
  readOnly: boolean;
  /**
   * The name attribute for the field (from props).
   * When used inside a Field component, the actual name is computed by combining this with fieldContext.name.
   */
  nameProp: string | undefined;
  /**
   * The id of the hidden input element.
   */
  id: string | undefined;
  /**
   * Methods to generate the placeholders for each section type.
   */
  placeholderGetters: TemporalFieldPlaceholderGetters | undefined;
  /**
   * Props used to check the validity of a date.
   */
  validationProps: TValidationProps;
  /**
   * The field context from Field.Root.
   * Contains state (disabled, touched, dirty, valid, filled, focused), callbacks (setDirty, setTouched, etc.), and validation.
   * Null when the temporal field is not used inside a Field component.
   */
  fieldContext: FieldRootContext | null;
}

export interface TemporalFieldCharacterEditingQuery {
  value: string;
  sectionIndex: number;
  part: TemporalFieldDatePartType;
}

export type TemporalFieldChangeReason = 'none';

export interface TemporalFieldParsedFormat {
  prefix: string;
  suffix: string;
  elements: (TemporalFieldToken | TemporalFieldSeparator)[];
}

export interface TemporalFieldToken {
  /**
   * Token value as present in the format string.
   * For example, on Date Fns, in the format `MM/DD/YYYY`, the token values are `MM`, `DD` and `YYYY`.
   */
  value: string;
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
   * Maximum length of the formatted value for this token.
   * Only defined for padded digit tokens.
   */
  maxLength: number | undefined;
  /**
   * Text to display when the section is empty.
   */
  placeholder: string;
}

export interface TemporalFieldSeparator {
  /**
   * Separator displayed as displayed the input.
   */
  value: string;
  /**
   * Index of the separator in the section list.
   */
  index: number;
}

export interface TemporalFieldDatePart {
  /**
   * Value of the section, as rendered inside the input.
   * For example, in the date `05/25/1995`, the value of the month section is "05".
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
   * Index of the date part in the section list.
   */
  index: number;
}

export type TemporalFieldSection = TemporalFieldDatePart | TemporalFieldSeparator;

export type TemporalFieldRangePosition = 'start' | 'end';

export type TemporalFieldSelectedSection = number | null;

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

/**
 * Configuration of a given field (DateField, TimeField, etc.).
 * It defines how to manipulate the value of the field.
 */
export interface TemporalFieldConfiguration<
  TValue extends TemporalSupportedValue,
  TError,
  TValidationProps extends {},
> {
  /**
   * Returns the manager of the field.
   */
  getManager: (adapter: TemporalAdapter) => TemporalManager<TValue, TError, TValidationProps>;
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
   * Extracts from the given value the date that contains the given section.
   */
  getDateFromSection: (
    value: TValue,
    section: TemporalFieldSection,
  ) => TemporalSupportedObject | null;
  /**
   * Gets the sections of the date that contains the given section.
   */
  getDateSectionsFromValue: (
    sections: TemporalFieldSection[],
    section: TemporalFieldSection,
  ) => TemporalFieldSection[];
  /**
   * Returns the reference value to use when mounting the component.
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
   * Clears all the sections representing the same date as the given section.
   */
  clearDateSections: (
    sections: TemporalFieldSection[],
    section: TemporalFieldSection,
  ) => TemporalFieldSection[];
  /**
   * Updates the reference value with the new value.
   * This method must make sure that no date inside the returned `referenceValue` is invalid.
   */
  updateReferenceValue: (
    adapter: TemporalAdapter,
    value: TValue,
    prevReferenceValue: TemporalNonNullableValue<TValue>,
  ) => TemporalNonNullableValue<TValue>;
  /**
   * Stringifies the value to be used in form submissions.
   */
  stringifyValue: (adapter: TemporalAdapter, value: TValue) => string;
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

export type TemporalFieldDatePartValueBoundaries<Part extends TemporalFieldDatePartType> = {
  minimum: number;
  maximum: number;
} & (Part extends 'day' ? { longestMonth: TemporalSupportedObject } : {});

export type TemporalFieldModelUpdater<
  State extends TemporalFieldState<any, any, any>,
  Parameters extends TemporalFieldStoreSharedParameters<any, any>,
> = (
  newState: Partial<State>,
  controlledProp: keyof Parameters & keyof State & string,
  defaultProp: keyof Parameters,
) => void;
