import { Store } from '@base-ui/utils/store';
import { warn } from '@base-ui/utils/warn';
import { TemporalSupportedObject, TemporalSupportedValue } from '../../types/temporal';
import { TemporalAdapter } from '../../types/temporal-adapter';
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

/**
 * Store managing the state of the Calendar and the Range Calendar components.
 */
export class SharedCalendarStore<
  TValue extends TemporalSupportedValue,
  TError,
> extends Store<State> {
  private valueManager: ValueManager<TValue>;

  private parameters: SharedCalendarStoreParameters<TValue, TError>;

  private initialParameters: SharedCalendarStoreParameters<TValue, TError> | null = null;

  private dayGrids: Record<number, TemporalSupportedObject> = {};

  private currentMonthDayGrid: Record<number, TemporalSupportedObject[]> = {};

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
        granularity: 'day',
        timezone: parameters.timezone ?? 'default',
        validationProps: { minDate: parameters.minDate, maxDate: parameters.maxDate },
        externalReferenceDate: parameters.referenceDate ?? null,
        externalDate: initialReferenceDateFromValue,
      });
    }

    super({
      ...SharedCalendarStore.deriveStateFromParameters(parameters, adapter, manager),
      visibleDate: initialVisibleDate,
      initialReferenceDateFromValue,
      value,
      navigationDirection: 'none',
    });

    this.valueManager = valueManager;
    this.parameters = parameters;

    if (process.env.NODE_ENV !== 'production') {
      this.initialParameters = parameters;
    }
  }

  public updateStateFromParameters = (
    parameters: SharedCalendarStoreParameters<TValue, TError>,
    adapter: TemporalAdapter,
    manager: TemporalManager<TValue, TError, any>,
  ) => {
    const updateModel: ModelUpdater<TValue, TError> = (
      mutableNewState,
      controlledProp,
      defaultProp,
    ) => {
      if (parameters[controlledProp] !== undefined) {
        mutableNewState[controlledProp] = parameters[controlledProp] as any;
      }

      if (process.env.NODE_ENV !== 'production') {
        const defaultValue = parameters[defaultProp];
        const isControlled = parameters[controlledProp] !== undefined;
        const initialDefaultValue = this.initialParameters?.[defaultProp];
        const initialIsControlled = this.initialParameters?.[controlledProp] !== undefined;

        if (initialIsControlled !== isControlled) {
          warn(
            `Base UI: A component is changing the ${
              initialIsControlled ? '' : 'un'
            }controlled ${controlledProp} state of (Range)Calendar to be ${initialIsControlled ? 'un' : ''}controlled.`,
            'Elements should not switch from uncontrolled to controlled (or vice versa).',
            `Decide between using a controlled or uncontrolled ${controlledProp} element for the lifetime of the component.`,
            "The nature of the state is determined during the first render. It's considered controlled if the value is not `undefined`.",
            'More info: https://fb.me/react-controlled-components',
          );
        } else if (JSON.stringify(initialDefaultValue) !== JSON.stringify(defaultValue)) {
          warn(
            `Base UI: A component is changing the default ${controlledProp} state of an uncontrolled (Range)Calendar after being initialized. `,
            `To suppress this warning opt to use a controlled (Range)Calendar.`,
          );
        }
      }
    };

    const newState = SharedCalendarStore.deriveStateFromParameters(
      parameters,
      adapter,
      manager,
    ) as Partial<State<TValue>>;

    updateModel(newState, 'value', 'defaultValue');
    updateModel(newState, 'visibleDate', 'defaultVisibleDate');

    // Update the visible date if the timezone has changed and the visible date is not controlled.
    if (parameters.visibleDate === undefined && parameters.timezone !== this.parameters.timezone) {
      newState.visibleDate = adapter.setTimezone(
        this.state.visibleDate,
        parameters.timezone ?? 'default',
      );
    }

    if (
      parameters.value !== undefined &&
      this.parameters.value !== undefined &&
      !adapter.isEqual(parameters.value, this.parameters.value)
    ) {
      const activeDate = this.valueManager.getActiveDateFromValue(parameters.value);
      if (adapter.isValid(activeDate)) {
        newState.visibleDate = activeDate;
        newState.navigationDirection = this.getNavigationDirectionFromVisibleDateChange(activeDate);
      }
    }

    this.update(newState);
    this.parameters = parameters;
  };

  /**
   * Sets the visible date.
   */
  public setVisibleDate = (
    visibleDate: TemporalSupportedObject,
    nativeEvent?: Event,
    trigger?: HTMLElement,
    reason?: CalendarChangeEventReason,
    skipIfAlreadyVisible?: boolean,
  ) => {
    if (skipIfAlreadyVisible && this.isDateCellVisible(visibleDate)) {
      return;
    }

    const eventDetails = createChangeEventDetails(reason ?? 'day-press', nativeEvent, trigger);

    this.parameters.onVisibleDateChange?.(visibleDate, eventDetails);
    if (!eventDetails.isCanceled && this.parameters.visibleDate === undefined) {
      this.update({
        visibleDate,
        navigationDirection: this.getNavigationDirectionFromVisibleDateChange(visibleDate),
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
   * Registers a day grid.
   */
  public registerDayGrid = (month: TemporalSupportedObject) => {
    const id = Math.random();
    this.dayGrids[id] = month;

    return () => {
      delete this.dayGrids[id];
    };
  };

  public getCurrentMonthDayGrid = () => {
    return this.currentMonthDayGrid;
  };

  /**
   * Registers the current month's day grid row/week.
   */
  public registerCurrentMonthDayGrid = (
    week: TemporalSupportedObject,
    days: TemporalSupportedObject[],
  ) => {
    const weekTime = this.state.adapter.getTime(week);
    if (this.currentMonthDayGrid[weekTime] == null) {
      this.currentMonthDayGrid[weekTime] = days;
    }
    return () => {
      delete this.currentMonthDayGrid[weekTime];
    };
  };

  /**
   * Returns the properties of the state that are derived from the parameters.
   * This do not contain state properties that don't update whenever the parameters update.
   */
  private static deriveStateFromParameters<TValue extends TemporalSupportedValue, TError>(
    parameters: SharedCalendarStoreParameters<TValue, TError>,
    adapter: TemporalAdapter,
    manager: TemporalManager<TValue, TError, any>,
  ) {
    return {
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
    };
  }

  /**
   * Sets the value.
   * Should only be used internally through `selectDate` method.
   */
  private setValue(newValue: TValue, event: React.MouseEvent<HTMLButtonElement>) {
    const inputTimezone = this.state.manager.getTimezone(this.state.value);
    const newValueWithInputTimezone =
      inputTimezone == null ? newValue : this.state.manager.setTimezone(newValue, inputTimezone);

    const eventDetails = createChangeEventDetails(
      'day-press',
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

    this.parameters.onValueChange?.(newValueWithInputTimezone, eventDetails);
    if (!eventDetails.isCanceled && this.parameters.value === undefined) {
      this.set('value', newValueWithInputTimezone);
    }
  }

  /**
   * Checks whether the given date is visible in any of the registered day grids.
   */
  private isDateCellVisible(date: TemporalSupportedObject) {
    if (Object.values(this.dayGrids).length > 0) {
      return Object.values(this.dayGrids).every(
        (month) => !this.state.adapter.isSameMonth(date, month),
      );
    }

    return true;
  }

  /**
   * Determines the navigation direction based on the new and the previous visible date.
   */
  private getNavigationDirectionFromVisibleDateChange(visibleDate: TemporalSupportedObject) {
    const prevVisibleDateTimestamp = this.state.adapter.getTime(this.state.visibleDate);
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

export type CalendarChangeEventReason = 'day-press' | 'month-change' | 'keyboard';

export type CalendarValueChangeEventDetails<TError> = BaseUIChangeEventDetails<
  CalendarChangeEventReason,
  CalendarValueChangeHandlerContext<TError>
>;

export type CalendarVisibleDateChangeEventDetails = BaseUIChangeEventDetails<
  CalendarChangeEventReason,
  {}
>;

type ModelUpdater<TValue extends TemporalSupportedValue, TError> = (
  newState: Partial<State<TValue>>,
  controlledProp: keyof SharedCalendarStoreParameters<TValue, TError> &
    keyof State<TValue> &
    string,
  defaultProp: keyof SharedCalendarStoreParameters<TValue, TError>,
) => void;
