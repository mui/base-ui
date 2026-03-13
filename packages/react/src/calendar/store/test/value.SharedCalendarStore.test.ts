import { expect } from 'chai';
import { spy } from 'sinon';
import { TemporalAdapterDateFns } from '../../../temporal-adapter-date-fns/TemporalAdapterDateFns';
import { TemporalValue } from '../../../types/temporal';
import { ValidateDateReturnValue } from '../../../utils/temporal/validateDate';
import { getDateManager } from '../../../utils/temporal/getDateManager';
import {
  SharedCalendarStore,
  SharedCalendarStoreParameters,
  CalendarValueChangeEventDetails,
} from '../SharedCalendarStore';
import { calendarValueManager } from '../../root/CalendarRoot';

/**
 * Creates a mock MouseEvent for testing selectDate.
 */
function createMockMouseEvent(): React.MouseEvent<HTMLButtonElement> {
  const nativeEvent = new MouseEvent('click');
  const currentTarget = document.createElement('button');

  return {
    nativeEvent,
    currentTarget,
    type: 'click',
    preventDefault: () => {},
    stopPropagation: () => {},
  } as unknown as React.MouseEvent<HTMLButtonElement>;
}

/**
 * Helper to create a SharedCalendarStore with sensible defaults.
 */
function createStore(
  adapter: TemporalAdapterDateFns,
  parameters: Partial<SharedCalendarStoreParameters<TemporalValue, ValidateDateReturnValue>> = {},
) {
  const manager = getDateManager(adapter);

  const fullParameters: SharedCalendarStoreParameters<TemporalValue, ValidateDateReturnValue> = {
    visibleDate: parameters.visibleDate ?? adapter.date('2025-02-01', 'default'),
    ...parameters,
  };

  return new SharedCalendarStore(fullParameters, adapter, manager, calendarValueManager);
}

describe('SharedCalendarStore - value', () => {
  const adapter = new TemporalAdapterDateFns();

  describe('initialization', () => {
    it('should initialize with null value when no value or defaultValue is provided', () => {
      const store = createStore(adapter);

      expect(store.state.value).to.equal(null);
    });

    it('should initialize with defaultValue when provided', () => {
      const defaultValue = adapter.date('2025-02-15', 'default');
      const store = createStore(adapter, { defaultValue });

      expect(adapter.isEqual(store.state.value, defaultValue)).to.equal(true);
    });

    it('should initialize with value when provided (controlled mode)', () => {
      const value = adapter.date('2025-02-20', 'default');
      const store = createStore(adapter, { value });

      expect(adapter.isEqual(store.state.value, value)).to.equal(true);
    });

    it('should prefer value over defaultValue when both are provided', () => {
      const value = adapter.date('2025-02-20', 'default');
      const store = createStore(adapter, {
        value,
        defaultValue: adapter.date('2025-02-15', 'default'),
      });

      expect(adapter.isEqual(store.state.value, value)).to.equal(true);
    });
  });

  describe('uncontrolled mode (defaultValue)', () => {
    it('should update internal value when selectDate is called', () => {
      const store = createStore(adapter, { defaultValue: adapter.date('2025-02-15', 'default') });
      const selectedDate = adapter.date('2025-02-20', 'default');

      store.selectDate(selectedDate, createMockMouseEvent());

      expect(adapter.isEqual(store.state.value, selectedDate)).to.equal(true);
    });

    it('should call onValueChange when selectDate is called', () => {
      const onValueChange = spy();
      const store = createStore(adapter, {
        defaultValue: adapter.date('2025-02-15', 'default'),
        onValueChange,
      });
      const selectedDate = adapter.date('2025-02-20', 'default');

      store.selectDate(selectedDate, createMockMouseEvent());

      expect(onValueChange.callCount).to.equal(1);
      expect(adapter.isEqual(onValueChange.firstCall.args[0], selectedDate)).to.equal(true);
    });

    it('should allow multiple value changes', () => {
      const onValueChange = spy();
      const store = createStore(adapter, {
        defaultValue: adapter.date('2025-02-15', 'default'),
        onValueChange,
      });

      const date1 = adapter.date('2025-02-18', 'default');
      const date2 = adapter.date('2025-02-22', 'default');

      store.selectDate(date1, createMockMouseEvent());
      expect(adapter.isEqual(store.state.value, date1)).to.equal(true);

      store.selectDate(date2, createMockMouseEvent());
      expect(adapter.isEqual(store.state.value, date2)).to.equal(true);

      expect(onValueChange.callCount).to.equal(2);
    });
  });

  describe('controlled mode (value prop)', () => {
    it('should not update internal value when selectDate is called', () => {
      const value = adapter.date('2025-02-15', 'default');
      const onValueChange = spy();
      const store = createStore(adapter, { value, onValueChange });
      const selectedDate = adapter.date('2025-02-20', 'default');

      store.selectDate(selectedDate, createMockMouseEvent());

      // Value should remain unchanged (controlled mode)
      expect(adapter.isEqual(store.state.value, value)).to.equal(true);
    });

    it('should call onValueChange when selectDate is called', () => {
      const value = adapter.date('2025-02-15', 'default');
      const onValueChange = spy();
      const store = createStore(adapter, { value, onValueChange });
      const selectedDate = adapter.date('2025-02-20', 'default');

      store.selectDate(selectedDate, createMockMouseEvent());

      expect(onValueChange.callCount).to.equal(1);
      expect(adapter.isEqual(onValueChange.firstCall.args[0], selectedDate)).to.equal(true);
    });
  });

  describe('onValueChange callback', () => {
    it('should return the validation error for invalid dates', () => {
      const onValueChange = spy();
      const minDate = adapter.date('2025-02-25', 'default');
      const store = createStore(adapter, { onValueChange, minDate });

      // Select a date before minDate
      const selectedDate = adapter.date('2025-02-20', 'default');
      store.selectDate(selectedDate, createMockMouseEvent());

      expect(onValueChange.callCount).to.equal(1);

      const eventDetails = onValueChange.firstCall
        .args[1] as CalendarValueChangeEventDetails<ValidateDateReturnValue>;
      const validationError = eventDetails.getValidationError();
      expect(validationError).to.equal('before-min-date');
    });

    it('should return null validation error for valid dates', () => {
      const onValueChange = spy();
      const minDate = adapter.date('2025-02-10', 'default');
      const store = createStore(adapter, { onValueChange, minDate });

      // Select a date after minDate
      const selectedDate = adapter.date('2025-02-20', 'default');
      store.selectDate(selectedDate, createMockMouseEvent());

      expect(onValueChange.callCount).to.equal(1);

      const eventDetails = onValueChange.firstCall
        .args[1] as CalendarValueChangeEventDetails<ValidateDateReturnValue>;
      const validationError = eventDetails.getValidationError();
      expect(validationError).to.equal(null);
    });

    it('should support eventDetails.cancel() when uncontrolled', () => {
      const defaultValue = adapter.date('2025-02-15', 'default');

      const store = createStore(adapter, {
        defaultValue,
        onValueChange: (_, eventDetails) => eventDetails.cancel(),
      });

      store.selectDate(adapter.date('2025-02-20', 'default'), createMockMouseEvent());

      // But value should remain unchanged
      expect(adapter.isEqual(store.state.value, defaultValue)).to.equal(true);
    });

    it('should support conditionally calling eventDetails.cancel() based on validation when uncontrolled', () => {
      const defaultValue = adapter.date('2025-02-15', 'default');
      const store = createStore(adapter, {
        defaultValue,
        onValueChange: (_, eventDetails) => {
          // Cancel if there's a validation error
          const error = eventDetails.getValidationError();
          if (error) {
            eventDetails.cancel();
          }
        },
        minDate: adapter.date('2025-02-18', 'default'),
      });

      // Try to select a date before minDate - should be canceled
      const invalidDate = adapter.date('2025-02-16', 'default');
      store.selectDate(invalidDate, createMockMouseEvent());

      // Value should remain unchanged
      expect(adapter.isEqual(store.state.value, defaultValue)).to.equal(true);

      // Select a valid date - should succeed
      const validDate = adapter.date('2025-02-20', 'default');
      store.selectDate(validDate, createMockMouseEvent());

      // Value should be updated
      expect(adapter.isEqual(store.state.value, validDate)).to.equal(true);
    });
  });

  describe('readOnly mode', () => {
    it('should not update value when readOnly is true', () => {
      const defaultValue = adapter.date('2025-02-15', 'default');
      const onValueChange = spy();
      const store = createStore(adapter, { defaultValue, onValueChange, readOnly: true });
      const selectedDate = adapter.date('2025-02-20', 'default');

      store.selectDate(selectedDate, createMockMouseEvent());

      // onValueChange should not be called
      expect(onValueChange.callCount).to.equal(0);

      // Value should remain unchanged
      expect(adapter.isEqual(store.state.value, defaultValue)).to.equal(true);
    });

    it('should not call onValueChange when readOnly is true', () => {
      const value = adapter.date('2025-02-15', 'default');
      const onValueChange = spy();
      const store = createStore(adapter, { value, onValueChange, readOnly: true });
      const selectedDate = adapter.date('2025-02-20', 'default');

      store.selectDate(selectedDate, createMockMouseEvent());

      expect(onValueChange.callCount).to.equal(0);
    });
  });

  describe('empty value handling', () => {
    it('should handle null value (controlled with empty)', () => {
      const store = createStore(adapter, { value: null });

      expect(store.state.value).to.equal(null);
    });

    it('should transition from null to a selected value in uncontrolled mode', () => {
      const onValueChange = spy();
      const store = createStore(adapter, { onValueChange });
      const selectedDate = adapter.date('2025-02-20', 'default');

      expect(store.state.value).to.equal(null);

      store.selectDate(selectedDate, createMockMouseEvent());

      expect(adapter.isEqual(store.state.value, selectedDate)).to.equal(true);
      expect(onValueChange.callCount).to.equal(1);
    });

    it('should call onValueChange when transitioning from null (controlled)', () => {
      const onValueChange = spy();
      const store = createStore(adapter, { value: null, onValueChange });
      const selectedDate = adapter.date('2025-02-20', 'default');

      store.selectDate(selectedDate, createMockMouseEvent());

      // Value remains null in controlled mode
      expect(store.state.value).to.equal(null);

      // But onValueChange should be called
      expect(onValueChange.callCount).to.equal(1);
      expect(adapter.isEqual(onValueChange.firstCall.args[0], selectedDate)).to.equal(true);
    });
  });
});
