import { FieldRootContext } from '../../field/root/FieldRootContext';
import { TextDirection } from '../../direction-provider';
import {
  BaseUIChangeEventDetails,
  TemporalAdapter,
  TemporalFormatTokenConfig,
  TemporalNonNullableValue,
  TemporalSupportedObject,
  TemporalSupportedValue,
  TemporalTimezone,
  TemporalFieldDatePartType,
} from '../../types';
import type { BaseUITranslations } from '../../translations/types';
import { GetInitialReferenceDateValidationProps } from '../../utils/temporal/getInitialReferenceDate';
import { TemporalManager } from '../../utils/temporal/types';

/**
 * Parameters for constructing a TemporalFieldStore.
 * All properties are required (must be explicitly provided), but some accept `undefined`.
 */
export interface TemporalFieldStoreParameters<TValue extends TemporalSupportedValue> {
  /**
   * The controlled value that should be selected.
   * To render an uncontrolled temporal field, use the `defaultValue` prop instead.
   */
  value: TValue | undefined;
  /**
   * The uncontrolled value that should be initially selected.
   * To render a controlled temporal field, use the `value` prop instead.
   */
  defaultValue: TValue | undefined;
  /**
   * Event handler called when the selected value changes.
   * Provides the new value as an argument.
   * Has `getValidationError()` in the `eventDetails` to retrieve the validation error associated to the new value.
   */
  onValueChange:
    | ((value: TValue, eventDetails: TemporalFieldValueChangeEventDetails) => void)
    | undefined;
  /**
   * The date used to generate the new value when both `value` and `defaultValue` are empty.
   * @default 'The closest valid date using the validation props.'
   */
  referenceDate: TemporalSupportedObject | undefined;
  /**
   * Format of the value when rendered in the field.
   */
  format: string;
  /**
   * The step increment for the most granular section of the field.
   * For example, with format 'HH:mm' and step=5, pressing ArrowUp on the minutes section
   * will increment by 5 (e.g., 10 -> 15 -> 20).
   * @default 1
   */
  step: number;
  /**
   * Whether the user must enter a value before submitting a form.
   * @default false
   */
  required: boolean | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled: boolean | undefined;
  /**
   * Whether the user should be unable to change the field value.
   * @default false
   */
  readOnly: boolean | undefined;
  /**
   * Identifies the field when a form is submitted.
   */
  name: string | undefined;
  /**
   * The id of the hidden input element.
   */
  id: string | undefined;
  /**
   * Minimal selectable date.
   */
  minDate: TemporalSupportedObject | undefined;
  /**
   * Maximal selectable date.
   */
  maxDate: TemporalSupportedObject | undefined;
  /**
   * Choose which timezone to use for the value.
   * Example: "default", "system", "UTC", "America/New_York".
   * If you pass values from other timezones to some props, they will be converted to this timezone before being used.
   * @default 'The timezone of the "value" or "defaultValue" prop if defined, "default" otherwise.'
   */
  timezone: TemporalTimezone | undefined;
  /**
   * The field context from Field.Root.
   * Contains state, callbacks, validation, etc.
   * Used internally when the temporal field is rendered inside a Field component.
   */
  fieldContext: FieldRootContext | null;
  /**
   * The adapter of the date library.
   */
  adapter: TemporalAdapter;
  /**
   * Text direction of the field.
   */
  direction: TextDirection;
  /**
   * Translations for component labels.
   * @default enUS
   */
  translations: BaseUITranslations | undefined;
}

export interface TemporalFieldState<TValue extends TemporalSupportedValue = any> {
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
  config: TemporalFieldConfiguration<TValue>;
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
  selectedSection: number | null;
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
   * Whether the user should be unable to change the field value.
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
   * The minimum selectable date.
   */
  minDate: TemporalSupportedObject | undefined;
  /**
   * The maximum selectable date.
   */
  maxDate: TemporalSupportedObject | undefined;
  /**
   * The field context from Field.Root.
   * Contains state (disabled, touched, dirty, valid, filled, focused), callbacks (setDirty, setTouched, etc.), and validation.
   * Is null when the temporal field is not used inside a Field component.
   */
  fieldContext: FieldRootContext | null;
  /**
   * The step increment for the most granular section.
   */
  step: number;
  /**
   * A ref to the input element (the div containing the sections).
   */
  inputRef: React.RefObject<HTMLElement | null>;
  /**
   * The raw format string as passed to props (e.g., "MM/DD/YYYY").
   * This is the unparsed format string; the parsed representation is in `format`.
   */
  rawFormat: string;
  /**
   * The parsed representation of the format string.
   */
  format: TemporalFieldParsedFormat;
  /**
   * Translations for component labels.
   */
  translations: BaseUITranslations;
}

export interface TemporalFieldCharacterEditingQuery {
  value: string;
  sectionIndex: number;
  part: TemporalFieldDatePartType;
}

type TemporalFieldChangeReason = 'none';

export interface TemporalFieldParsedFormat {
  elements: (TemporalFieldToken | TemporalFieldSeparator)[];
  granularity: TemporalFieldDatePartType;
}

export interface TemporalFieldToken {
  type: 'token';
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
  /**
   * Whether this token represents the most granular section in the format.
   * When true, the field's `step` prop applies to this section during value adjustment.
   */
  isMostGranularPart: boolean;
  /**
   * Boundaries for this date part when adjusting using arrow keys, Home/End, etc.
   */
  boundaries: TemporalFieldDatePartValueBoundaries;
  /**
   * Transfers the value of this date part from a source date to a target date.
   */
  transferValue(
    sourceDate: TemporalSupportedObject,
    targetDate: TemporalSupportedObject,
    datePart: TemporalFieldDatePart,
  ): TemporalSupportedObject;
}

export interface TemporalFieldSeparator {
  type: 'separator';
  /**
   * Separator displayed in the input.
   */
  value: string;
  /**
   * Index of the separator in the section list.
   */
  index: number;
}

export interface TemporalFieldDatePart {
  type: 'datePart';
  /**
   * Value of the section, as rendered inside the input.
   * For example, in the date `05/25/1995`, the value of the month section is "05".
   */
  value: string;
  /**
   * Whether the section value has been modified since the last time the sections were generated from a valid date.
   * When we can generate a valid date from the section, we don't directly pass the generated date to `onChange`,
   * Otherwise, we would lose all the information contained in the original date, things like:
   * - time if the format does not contain it
   * - timezone
   *
   * To avoid losing those informations, we transfer the values of the modified sections from the newly generated date to the original date.
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

export type TemporalFieldValueChangeEventDetails =
  BaseUIChangeEventDetails<TemporalFieldChangeReason>;

/**
 * Configuration of a given field (DateField, TimeField, etc.).
 * It defines how to manipulate the value of the field.
 */
export interface TemporalFieldConfiguration<TValue extends TemporalSupportedValue> {
  /**
   * Returns the manager of the field.
   */
  getManager: (
    adapter: TemporalAdapter,
  ) => TemporalManager<TValue, any, TemporalFieldValidationProps>;
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
    granularity: TemporalFieldDatePartType;
    timezone: TemporalTimezone;
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
  /**
   * Returns the type attribute for the hidden input.
   * Used for native HTML validation (e.g., 'date' or 'time').
   */
  hiddenInputType: 'date' | 'time' | 'datetime-local';
  /**
   * Stringifies the value for hidden input format.
   * For date inputs: 'YYYY-MM-DD'
   * For time inputs: 'HH:MM' or 'HH:MM:SS'
   * For datetime-local inputs: 'YYYY-MM-DDTHH:MM' or 'YYYY-MM-DDTHH:MM:SS'
   * Returns 'invalid' for partial input (some sections filled) to trigger badInput validation.
   * Returns '' for empty input to trigger valueMissing validation if required.
   */
  stringifyValueForHiddenInput: (
    adapter: TemporalAdapter,
    value: TValue,
    granularity: TemporalFieldDatePartType,
  ) => string;
  /**
   * Stringifies the min/max/step validation props for hidden input attributes.
   */
  stringifyValidationPropsForHiddenInput: (
    adapter: TemporalAdapter,
    validationProps: TemporalFieldValidationProps,
    parsedFormat: TemporalFieldParsedFormat,
    step: number,
  ) => HiddenInputValidationProps;
}

export interface HiddenInputValidationProps {
  min?: string | undefined;
  max?: string | undefined;
  step?: string | undefined;
}

export interface TemporalFieldDatePartValueBoundaries {
  /**
   * Boundaries when adjusting the value using ArrowUp, ArrowDown, PageUp, PageDown, Home, End, etc.
   */
  adjustment: {
    minimum: number;
    maximum: number;
  };
  /**
   * Boundaries when editing the value using character keys.
   */
  characterEditing: {
    minimum: number;
    maximum: number;
  };
}

export interface TemporalFieldValidationProps {
  minDate?: TemporalSupportedObject | undefined;
  maxDate?: TemporalSupportedObject | undefined;
}

/**
 * Actions that can be performed imperatively on a temporal field via actionsRef.
 */
export interface TemporalFieldRootActions {
  /**
   * Clears the field value.
   * If the value is already empty, it clears the sections (visual placeholders).
   */
  clear: () => void;
}

export interface EditSectionParameters {
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
export type TemporalFieldQueryApplier = (
  queryValue: string,
  datePart: TemporalFieldDatePart,
) => { datePartValue: string; shouldGoToNextSection: boolean } | { saveQuery: boolean };

export type AdjustDatePartValueKeyCode =
  | 'ArrowUp'
  | 'ArrowDown'
  | 'PageUp'
  | 'PageDown'
  | 'Home'
  | 'End';

export interface UpdateDatePartParameters {
  /**
   * The section on which we want to apply the new value.
   */
  sectionIndex: number;
  /**
   * Value to apply to the active section.
   */
  newDatePartValue: string;
  /**
   * Whether the focus will move to the next section if any.
   */
  shouldGoToNextSection: boolean;
}
