import { ReactStore } from '@base-ui/utils/store';
import {
  TemporalSupportedObject,
  TemporalSupportedValue,
  TemporalAdapter,
} from '../../types/temporal';
import { ValidateDateValidationProps } from '../../utils/temporal/validateDate';
import { getInitialReferenceDate } from '../../utils/temporal/getInitialReferenceDate';
import { TemporalManager, TemporalTimezoneProps } from '../../utils/temporal/types';
import {
  BaseUIChangeEventDetails,
  createChangeEventDetails,
} from '../../utils/createBaseUIEventDetails';
import { mergeDateAndTime } from '../../utils/temporal/date-helpers';
import { CalendarNavigationDirection, SharedCalendarState as State } from './SharedCalendarState';
import { selectors } from './selectors';
import { BaseUIEventReasons, REASONS } from '../../utils/reasons';

export interface SharedCalendarStoreContext<TValue extends TemporalSupportedValue, TError> {
  onValueChange?:
    | ((value: TValue, eventDetails: CalendarValueChangeEventDetails<TError>) => void)
    | undefined;
  onVisibleDateChange?:
    | ((
        visibleDate: TemporalSupportedObject,
        eventDetails: CalendarVisibleDateChangeEventDetails,
      ) => void)
    | undefined;
}

/**
 * Store managing the state of the Calendar and the Range Calendar components.
 */
export class SharedCalendarStore<TValue extends TemporalSupportedValue, TError> extends ReactStore<
  State<TValue>,
  SharedCalendarStoreContext<TValue, TError>
> {
  private valueManager: ValueManager<TValue>;

  constructor(
    parameters: SharedCalendarStoreParameters<TValue, TError>,
    adapter: TemporalAdapter,
    manager: TemporalManager<TValue, TError, any>,
    valueManager: ValueManager<TValue>,
  ) {
    const value = parameters.value ?? parameters.defaultValue ?? manager.emptyValue;
    const initialReferenceDateFromValue = valueManager.getDateToUseForReferenceDate(value);

    let initialVisibleDate: TemporalSupportedObject;
    if (parameters.visibleDate) {
      initialVisibleDate = parameters.visibleDate;
    } else if (parameters.defaultVisibleDate) {
      initialVisibleDate = parameters.defaultVisibleDate;
    } else {
      initialVisibleDate = getInitialReferenceDate({
        adapter,
        timezone: parameters.timezone ?? 'default',
        validationProps: { minDate: parameters.minDate, maxDate: parameters.maxDate },
        externalReferenceDate: parameters.referenceDate ?? null,
        externalDate: initialReferenceDateFromValue,
      });
    }

    super(
      {
        adapter,
        manager,
        timezoneProp: parameters.timezone,
        referenceDateProp: parameters.referenceDate ?? null,
        minDate: parameters.minDate,
        maxDate: parameters.maxDate,
        isDateUnavailable: parameters.isDateUnavailable,
        disabled: parameters.disabled ?? false,
        readOnly: parameters.readOnly ?? false,
        invalidProp: parameters.invalid,
        monthPageSize: parameters.monthPageSize ?? 1,
        visibleDate: initialVisibleDate,
        visibleDateProp: parameters.visibleDate,
        initialReferenceDateFromValue,
        value,
        valueProp: parameters.value,
        navigationDirection: 'none',
      },
      {
        onValueChange: parameters.onValueChange,
        onVisibleDateChange: parameters.onVisibleDateChange,
      },
    );

    this.valueManager = valueManager;

    // When the controlled value prop changes, sync the internal value
    // and auto-update visibleDate to the active date.
    this.observe(
      (state) => state.valueProp,
      (newValueProp, oldValueProp) => {
        if (
          newValueProp !== undefined &&
          oldValueProp !== undefined &&
          !this.state.adapter.isEqual(newValueProp, oldValueProp)
        ) {
          this.set('value', newValueProp);
          const visibleDate = this.valueManager.getActiveDateFromValue(newValueProp);
          if (
            this.state.adapter.isValid(visibleDate) &&
            !this.state.adapter.isSameMonth(visibleDate, this.state.visibleDate)
          ) {
            this.setVisibleDate(visibleDate, undefined, undefined, REASONS.valuePropChange);
          }
        }
      },
    );

    // When the controlled visible date prop changes, update the navigation direction.
    this.observe(
      (state) => state.visibleDateProp,
      (newVisibleDateProp, oldVisibleDateProp) => {
        if (
          newVisibleDateProp !== undefined &&
          oldVisibleDateProp !== undefined &&
          !this.state.adapter.isEqual(newVisibleDateProp, oldVisibleDateProp)
        ) {
          this.set(
            'navigationDirection',
            this.getNavigationDirectionFromVisibleDateChange(
              newVisibleDateProp,
              oldVisibleDateProp,
            ),
          );
        }
      },
    );
  }

  /**
   * Sets the visible date.
   */
  public setVisibleDate = (
    visibleDate: TemporalSupportedObject,
    nativeEvent?: Event,
    trigger?: HTMLElement,
    reason?: CalendarChangeEventReason,
  ) => {
    const eventDetails = createChangeEventDetails(reason ?? REASONS.dayPress, nativeEvent, trigger);

    this.context.onVisibleDateChange?.(visibleDate, eventDetails);
    if (!eventDetails.isCanceled && this.state.visibleDateProp === undefined) {
      this.update({
        visibleDate,
        navigationDirection: this.getNavigationDirectionFromVisibleDateChange(
          visibleDate,
          this.state.visibleDate,
        ),
      });
    }
  };

  /**
   * Selects a date.
   */
  public selectDate = (
    selectedDate: TemporalSupportedObject,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (this.state.readOnly) {
      return;
    }

    const referenceDate = selectors.referenceDate(this.state);
    const activeDate = this.valueManager.getActiveDateFromValue(this.state.value) ?? referenceDate;
    const cleanSelectedDate = mergeDateAndTime(this.state.adapter, selectedDate, activeDate);

    this.valueManager.onSelectDate({
      setValue: (newValue) => this.setValue(newValue, event),
      prevValue: this.state.value,
      selectedDate: cleanSelectedDate,
      referenceDate,
    });
  };

  /**
   * Sets the value.
   * Should only be used internally through `selectDate` method.
   */
  private setValue(newValue: TValue, event: React.MouseEvent<HTMLButtonElement>) {
    const inputTimezone = this.state.manager.getTimezone(this.state.value);
    const newValueWithInputTimezone =
      inputTimezone == null ? newValue : this.state.manager.setTimezone(newValue, inputTimezone);

    const eventDetails = createChangeEventDetails(
      REASONS.dayPress,
      event.nativeEvent,
      event.currentTarget,
      {
        getValidationError: () =>
          this.state.manager.getValidationError(
            newValueWithInputTimezone,
            selectors.validationProps(this.state),
          ),
      },
    );

    this.context.onValueChange?.(newValueWithInputTimezone, eventDetails);
    if (!eventDetails.isCanceled && this.state.valueProp === undefined) {
      this.set('value', newValueWithInputTimezone);
    }
  }

  /**
   * Determines the navigation direction based on the new and the previous visible date.
   */
  private getNavigationDirectionFromVisibleDateChange(
    visibleDate: TemporalSupportedObject,
    previousVisibleDate: TemporalSupportedObject,
  ) {
    const prevVisibleDateTimestamp = this.state.adapter.getTime(previousVisibleDate);
    const visibleDateTimestamp = this.state.adapter.getTime(visibleDate);

    let newNavigationDirection: CalendarNavigationDirection = 'none';
    if (visibleDateTimestamp < prevVisibleDateTimestamp) {
      newNavigationDirection = 'previous';
    } else if (visibleDateTimestamp > prevVisibleDateTimestamp) {
      newNavigationDirection = 'next';
    }
    return newNavigationDirection;
  }
}

export interface SharedCalendarStoreParameters<TValue extends TemporalSupportedValue, TError>
  extends TemporalTimezoneProps, ValidateDateValidationProps {
  /**
   * The controlled value that should be selected.
   * To render an uncontrolled (Range)Calendar, use the `defaultValue` prop instead.
   */
  value?: TValue | undefined;
  /**
   * The uncontrolled value that should be initially selected.
   * To render a controlled (Range)Calendar, use the `value` prop instead.
   */
  defaultValue?: TValue | undefined;
  /**
   * Event handler called when the selected value changes.
   * Provides the new value as an argument.
   * Has `getValidationError()` in the `eventDetails` to retrieve the validation error associated to the new value.
   */
  onValueChange?:
    | ((value: TValue, eventDetails: CalendarValueChangeEventDetails<TError>) => void)
    | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether the user should be unable to select a date in the calendar.
   * @default false
   */
  readOnly?: boolean | undefined;
  /**
   * Whether the calendar is forcefully marked as invalid.
   * A calendar can be invalid when the selected date fails validation (that is, is outside of the allowed `minDate` and `maxDate` range).
   * @default false
   */
  invalid?: boolean | undefined;
  /**
   * Mark specific dates as unavailable.
   * Those dates will not be selectable but they will still be focusable with the keyboard.
   */
  isDateUnavailable?: ((day: TemporalSupportedObject) => boolean) | undefined;
  /**
   * The date used to decide which month should be displayed in the Day Grid.
   * To render an uncontrolled Calendar, use the `defaultVisibleDate` prop instead.
   */
  visibleDate?: TemporalSupportedObject | undefined;
  /**
   * The date used to decide which month should be initially displayed in the Day Grid.
   * To render a controlled Calendar, use the `visibleDate` prop instead.
   */
  defaultVisibleDate?: TemporalSupportedObject | undefined;
  /**
   * Event handler called when the visible date changes.
   * Provides the new date as an argument.
   * Has the change reason in the `eventDetails`.
   */
  onVisibleDateChange?:
    | ((
        visibleDate: TemporalSupportedObject,
        eventDetails: CalendarVisibleDateChangeEventDetails,
      ) => void)
    | undefined;
  /**
   * The date used to generate the new value when both `value` and `defaultValue` are empty.
   * It can be used to:
   * - set a desired time on the selected date;
   * - set a desired default year or month;
   * @default 'The closest valid date using the validation props.'
   */
  referenceDate?: TemporalSupportedObject | undefined;
  /**
   * The amount of months to move by when navigating.
   * This is mostly useful when displaying multiple day grids.
   * @default 1
   */
  monthPageSize?: number | undefined;
}

export interface ValueManager<TValue extends TemporalSupportedValue> {
  /**
   * Returns the date to use for the reference date.
   */
  getDateToUseForReferenceDate: (value: TValue) => TemporalSupportedObject | null;
  /**
   * Runs logic when a date is selected.
   * This is used to correctly update the value on the Range Calendar.
   */
  onSelectDate: (parameters: OnSelectDateParameters<TValue>) => void;
  /**
   * Returns the active date from the value.
   * This is used to determine which date is being edited in the Range Calendar (start of end date).
   */
  getActiveDateFromValue: (value: TValue) => TemporalSupportedObject | null;
}

export interface OnSelectDateParameters<TValue extends TemporalSupportedValue> {
  setValue: (value: TValue) => void;
  /**
   * The value before the change.
   */
  prevValue: TValue;
  /**
   * The date to select.
   */
  selectedDate: TemporalSupportedObject;
  /**
   * The reference date.
   */
  referenceDate: TemporalSupportedObject;
}

export interface CalendarValueChangeHandlerContext<TError> {
  /**
   * The validation error associated to the new value.
   */
  getValidationError: () => TError;
}

export type CalendarChangeEventReason =
  | BaseUIEventReasons['monthChange']
  | BaseUIEventReasons['valuePropChange']
  | BaseUIEventReasons['dayPress']
  | BaseUIEventReasons['keyboard'];

export type CalendarValueChangeEventDetails<TError> = BaseUIChangeEventDetails<
  CalendarChangeEventReason,
  CalendarValueChangeHandlerContext<TError>
>;

export type CalendarVisibleDateChangeEventDetails = BaseUIChangeEventDetails<
  CalendarChangeEventReason,
  {}
>;
