import {
  BaseUIChangeEventDetails,
  TemporalAdapter,
  TemporalFieldSectionType,
  TemporalFormatTokenConfig,
  TemporalRangeValue,
  TemporalSupportedObject,
  TemporalSupportedValue,
  TemporalTimezone,
} from '../../../types';
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
   * Whether the field should respect the leading zeroes of its format.
   * For example, the format "M/d/yyyy" will render "4/7/2022" when `true` and "04/07/2022" when `false`.
   *
   * Warning: When `shouldRespectLeadingZeros={true}`, the field will add an invisible character on the sections containing a single digit to make sure `onChange` is fired.
   * If you need to get the clean value from the input, you can remove this character using `input.value.replace(/\u200e/g, '')`.
   *
   * @default false
   */
  // Additional warnings that don't apply to Date Fns
  // Warning: Luxon is not able to respect the leading zeroes when using macro tokens (for example "DD"), so `shouldRespectLeadingZeros={true}` might lead to inconsistencies when using `TemporalAdapterLuxon`.
  // Warning: When used in strict mode, dayjs and moment require to respect the leading zeros.
  // This mean that when using `shouldRespectLeadingZeros={false}`, if you retrieve the value directly from the input (not listening to `onChange`) and your format contains tokens without leading zeros, the value will not be parsed by your library.
  shouldRespectLeadingZeros?: boolean;
}

export interface TemporalFieldState<TValue extends TemporalSupportedValue = any> {
  /**
   * The value of the field, as passed to `props.value` or `props.defaultValue`.
   */
  value: TValue;
  /**
   * The timezone as passed to `props.timezone`.
   */
  timezoneProp: TemporalTimezone | undefined;
  /**
   * The reference date as passed to `props.referenceDate`.
   */
  referenceDateProp: TemporalSupportedObject | null;
  /**
   * Whether the field should respect the leading zeroes of its format.
   */
  shouldRespectLeadingZeros: boolean;
  /**
   * The manager of the field (uses `getDateManager` for DateField and `getTimeManager` for TimeField).
   * Not publicly exposed, is only set in state to avoid passing it to the selectors.
   */
  manager: TemporalManager<TValue, any, any>;
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
  sections: TemporalFieldSection<TValue>[];
  /**
   * Android `onChange` behavior when the input selection is not empty is quite different from a desktop behavior.
   * There are two `onChange` calls:
   * 1. A call with the selected content removed.
   * 2. A call with the key pressed added to the value.
   **
   * For instance, if the input value equals `month / day / year` and `day` is selected.
   * The pressing `1` will have the following behavior:
   * 1. A call with `month /  / year`.
   * 2. A call with `month / 1 / year`.
   *
   * But if you don't update the input with the value passed on the first `onChange`.
   * Then the second `onChange` will add the key press at the beginning of the selected value.
   * 1. A call with `month / / year` that we don't set into state.
   * 2. A call with `month / 1day / year`.
   *
   * The property below allows us to set the first `onChange` value into state waiting for the second one.
   */
  tempValueStrAndroid: string | null;
}

export interface TemporalFieldCharacterEditingQuery {
  value: string;
  sectionIndex: number;
  sectionType: TemporalFieldSectionType;
}

export type TemporalFieldChangeReason = 'none';

export interface TemporalFieldNonRangeSection extends TemporalFormatTokenConfig {
  /**
   * Value of the section, as rendered inside the input.
   * For example, in the date `May 25, 1995`, the value of the month section is "May".
   */
  value: string;
  /**
   * Format token used to parse the value of this section from the date object.
   * For example, in the format `MMMM D, YYYY`, the format of the month section is "MMMM".
   */
  format: string;
  /**
   * Placeholder rendered when the value of this section is empty.
   */
  placeholder: string;
  /**
   * If `true`, the value of this section is supposed to have leading zeroes when parsed by the date library.
   * For example, the value `1` should be rendered as "01" instead of "1".
   */
  hasLeadingZerosInFormat: boolean;
  /**
   * If `true`, the value of this section is supposed to have leading zeroes when rendered in the input.
   * For example, the value `1` should be rendered as "01" instead of "1".
   */
  hasLeadingZerosInInput: boolean;
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
   * Separator displayed before the value of the section in the input.
   * If it contains escaped characters, then it must not have the escaping characters.
   * For example, on Day.js, the `year` section of the format `YYYY [year]` has an end separator equal to `year` not `[year]`
   */
  startSeparator: string;
  /**
   * Separator displayed after the value of the section in the input.
   * If it contains escaped characters, then it must not have the escaping characters.
   * For example, on Day.js, the `year` section of the format `[year] YYYY` has a start separator equal to `[year]`
   */
  endSeparator: string;
  /**
   * If `true`, the `endSeparator` is a format separator (i.e. ":" or "/").
   */
  isEndFormatSeparator?: boolean;
}

export type TemporalFieldRangePosition = 'start' | 'end';

export interface TemporalFieldRangeSection extends TemporalFieldNonRangeSection {
  dateName: TemporalFieldRangePosition;
}

// If `PickerValidDate` contains `any`, then `TValue extends PickerRangeValue` will return true, so we have to handle this edge case first.
type IsAny<T> = boolean extends (T extends never ? true : false) ? true : false;

export type TemporalFieldSection<TValue extends TemporalSupportedValue> =
  IsAny<TValue> extends true
    ? TemporalFieldNonRangeSection
    : TValue extends TemporalRangeValue
      ? TemporalFieldRangeSection
      : TemporalFieldNonRangeSection;

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
    getSectionsFromDate: (date: TemporalSupportedObject | null) => TemporalFieldNonRangeSection[],
  ) => TemporalFieldSection<TValue>[];
}
