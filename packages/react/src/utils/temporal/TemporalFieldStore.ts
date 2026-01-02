import { Store } from '@base-ui/utils/store';
import {
  BaseUIChangeEventDetails,
  TemporalAdapter,
  TemporalSupportedObject,
  TemporalSupportedValue,
  TemporalTimezone,
} from '../../types';
import { TemporalManager, TemporalTimezoneProps } from './types';

export class TemporalFieldStore<
  TValue extends TemporalSupportedValue,
  TError,
> extends Store<TemporalFieldState> {
  private parameters: TemporalFieldStoreParameters<TValue, TError>;

  private initialParameters: TemporalFieldStoreParameters<TValue, TError> | null = null;

  constructor(
    parameters: TemporalFieldStoreParameters<TValue, TError>,
    adapter: TemporalAdapter,
    manager: TemporalManager<TValue, TError, any>,
  ) {
    const value = parameters.value ?? parameters.defaultValue ?? manager.emptyValue;

    super({
      value,
      timezoneProp: parameters.timezone,
      referenceDateProp: null,
      adapter,
      manager,
    });

    this.parameters = parameters;

    if (process.env.NODE_ENV !== 'production') {
      this.initialParameters = parameters;
    }
  }
}

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
}

interface TemporalFieldState<TValue extends TemporalSupportedValue = any> {
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
   * The manager of the field (uses `getDateManager` for DateField and `getTimeManager` for TimeField).
   * Not publicly exposed, is only set in state to avoid passing it to the selectors.
   */
  manager: TemporalManager<TValue, any, any>;
  /**
   * The adapter of the date library.
   * Not publicly exposed, is only set in state to avoid passing it to the selectors.
   */
  adapter: TemporalAdapter;
}

export type TemporalFieldChangeReason = 'none';

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
