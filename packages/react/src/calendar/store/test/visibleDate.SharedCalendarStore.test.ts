import { expect } from 'chai';
import { spy } from 'sinon';
import { TemporalAdapterDateFns } from '../../../temporal-adapter-date-fns/TemporalAdapterDateFns';
import { TemporalValue } from '../../../types/temporal';
import { ValidateDateReturnValue } from '../../../utils/temporal/validateDate';
import { getDateManager } from '../../../utils/temporal/getDateManager';
import {
  SharedCalendarStore,
  SharedCalendarStoreParameters,
  CalendarVisibleDateChangeEventDetails,
} from '../SharedCalendarStore';
import { calendarValueManager } from '../../root/CalendarRoot';

/**
 * Helper to create a SharedCalendarStore with sensible defaults.
 */
function createStore(
  adapter: TemporalAdapterDateFns,
  parameters: Partial<SharedCalendarStoreParameters<TemporalValue, ValidateDateReturnValue>> = {},
) {
  const manager = getDateManager(adapter);

  const fullParameters: SharedCalendarStoreParameters<TemporalValue, ValidateDateReturnValue> = {
    ...parameters,
  };

  return new SharedCalendarStore(fullParameters, adapter, manager, calendarValueManager);
}

describe('SharedCalendarStore - visibleDate', () => {
  const adapter = new TemporalAdapterDateFns();

  describe('initialization', () => {
    it('should initialize with visibleDate when provided', () => {
      const visibleDate = adapter.date('2025-03-15', 'default');
      const store = createStore(adapter, { visibleDate });

      expect(adapter.isEqual(store.state.visibleDate, visibleDate)).to.equal(true);
    });

    it('should initialize with defaultVisibleDate when provided', () => {
      const defaultVisibleDate = adapter.date('2025-04-20', 'default');
      const store = createStore(adapter, { defaultVisibleDate });

      expect(adapter.isEqual(store.state.visibleDate, defaultVisibleDate)).to.equal(true);
    });

    it('should prefer visibleDate over defaultVisibleDate when both are provided', () => {
      const visibleDate = adapter.date('2025-03-15', 'default');
      const store = createStore(adapter, {
        visibleDate,
        defaultVisibleDate: adapter.date('2025-04-20', 'default'),
      });

      expect(adapter.isEqual(store.state.visibleDate, visibleDate)).to.equal(true);
    });

    it('should derive visibleDate from value when no visibleDate props are provided', () => {
      const value = adapter.date('2025-05-10', 'default');
      const store = createStore(adapter, { value });

      // Should use the value as the initial visible date
      expect(adapter.isEqual(store.state.visibleDate, value)).to.equal(true);
    });

    it('should derive visibleDate from defaultValue when no visibleDate props are provided', () => {
      const defaultValue = adapter.date('2025-06-15', 'default');
      const store = createStore(adapter, { defaultValue });

      // Should use the defaultValue as the initial visible date
      expect(adapter.isEqual(store.state.visibleDate, defaultValue)).to.equal(true);
    });

    it('should derive visibleDate from referenceDate when no value or visibleDate props are provided', () => {
      const referenceDate = adapter.date('2025-07-20', 'default');
      const store = createStore(adapter, { referenceDate });

      // Should use the referenceDate as the initial visible date
      expect(adapter.isEqual(store.state.visibleDate, referenceDate)).to.equal(true);
    });
  });

  describe('uncontrolled mode (defaultVisibleDate)', () => {
    it('should update internal visibleDate when setVisibleDate is called', () => {
      const store = createStore(adapter, {
        defaultVisibleDate: adapter.date('2025-02-01', 'default'),
      });
      const newVisibleDate = adapter.date('2025-03-01', 'default');

      store.setVisibleDate(newVisibleDate);

      expect(adapter.isEqual(store.state.visibleDate, newVisibleDate)).to.equal(true);
    });

    it('should call onVisibleDateChange when setVisibleDate is called', () => {
      const onVisibleDateChange = spy();
      const store = createStore(adapter, {
        defaultVisibleDate: adapter.date('2025-02-01', 'default'),
        onVisibleDateChange,
      });
      const newVisibleDate = adapter.date('2025-03-01', 'default');

      store.setVisibleDate(newVisibleDate);

      expect(onVisibleDateChange.callCount).to.equal(1);
      expect(adapter.isEqual(onVisibleDateChange.firstCall.args[0], newVisibleDate)).to.equal(true);
    });

    it('should allow multiple visibleDate changes', () => {
      const onVisibleDateChange = spy();
      const store = createStore(adapter, {
        defaultVisibleDate: adapter.date('2025-02-01', 'default'),
        onVisibleDateChange,
      });

      const date1 = adapter.date('2025-03-01', 'default');
      const date2 = adapter.date('2025-04-01', 'default');

      store.setVisibleDate(date1);
      expect(adapter.isEqual(store.state.visibleDate, date1)).to.equal(true);

      store.setVisibleDate(date2);
      expect(adapter.isEqual(store.state.visibleDate, date2)).to.equal(true);

      expect(onVisibleDateChange.callCount).to.equal(2);
    });
  });

  describe('controlled mode (visibleDate prop)', () => {
    it('should not update internal visibleDate when setVisibleDate is called', () => {
      const visibleDate = adapter.date('2025-02-01', 'default');
      const onVisibleDateChange = spy();
      const store = createStore(adapter, { visibleDate, onVisibleDateChange });
      const newVisibleDate = adapter.date('2025-03-01', 'default');

      store.setVisibleDate(newVisibleDate);

      // visibleDate should remain unchanged (controlled mode)
      expect(adapter.isEqual(store.state.visibleDate, visibleDate)).to.equal(true);
    });

    it('should call onVisibleDateChange when setVisibleDate is called', () => {
      const visibleDate = adapter.date('2025-02-01', 'default');
      const onVisibleDateChange = spy();
      const store = createStore(adapter, { visibleDate, onVisibleDateChange });
      const newVisibleDate = adapter.date('2025-03-01', 'default');

      store.setVisibleDate(newVisibleDate);

      expect(onVisibleDateChange.callCount).to.equal(1);
      expect(adapter.isEqual(onVisibleDateChange.firstCall.args[0], newVisibleDate)).to.equal(true);
    });

    it('should update visibleDate when updateStateFromParameters is called with new visibleDate', () => {
      const initialVisibleDate = adapter.date('2025-02-01', 'default');
      const store = createStore(adapter, { visibleDate: initialVisibleDate });
      const manager = getDateManager(adapter);

      const newVisibleDate = adapter.date('2025-03-01', 'default');
      store.updateStateFromParameters({ visibleDate: newVisibleDate }, adapter, manager);

      expect(adapter.isEqual(store.state.visibleDate, newVisibleDate)).to.equal(true);
    });
  });

  describe('onVisibleDateChange callback', () => {
    it('should pass eventDetails as second argument', () => {
      const onVisibleDateChange = spy();
      const store = createStore(adapter, {
        defaultVisibleDate: adapter.date('2025-02-01', 'default'),
        onVisibleDateChange,
      });
      const newVisibleDate = adapter.date('2025-03-01', 'default');

      store.setVisibleDate(newVisibleDate);

      expect(onVisibleDateChange.callCount).to.equal(1);

      const eventDetails = onVisibleDateChange.firstCall
        .args[1] as CalendarVisibleDateChangeEventDetails;
      expect(eventDetails).not.to.equal(undefined);
      expect(eventDetails.reason).to.equal('day-press');
      expect(eventDetails.event).to.be.instanceOf(Event);
      expect(eventDetails.isCanceled).to.equal(false);
      expect(typeof eventDetails.cancel).to.equal('function');
    });

    it('should support eventDetails.cancel() when uncontrolled', () => {
      const defaultVisibleDate = adapter.date('2025-02-01', 'default');
      const store = createStore(adapter, {
        defaultVisibleDate,
        onVisibleDateChange: (_, eventDetails) => eventDetails.cancel(),
      });
      const newVisibleDate = adapter.date('2025-03-01', 'default');

      store.setVisibleDate(newVisibleDate);

      // visibleDate should remain unchanged because cancel() was called
      expect(adapter.isEqual(store.state.visibleDate, defaultVisibleDate)).to.equal(true);
    });

    it("should pass reason 'month-change' in eventDetails when reason is 'month-change'", () => {
      const onVisibleDateChange = spy();
      const store = createStore(adapter, {
        defaultVisibleDate: adapter.date('2025-02-01', 'default'),
        onVisibleDateChange,
      });
      const newVisibleDate = adapter.date('2025-03-01', 'default');

      store.setVisibleDate(newVisibleDate, undefined, undefined, 'month-change');

      const eventDetails = onVisibleDateChange.firstCall
        .args[1] as CalendarVisibleDateChangeEventDetails;
      expect(eventDetails.reason).to.equal('month-change');
    });

    it("should pass reason 'keyboard' in eventDetails when reason is 'keyboard'", () => {
      const onVisibleDateChange = spy();
      const store = createStore(adapter, {
        defaultVisibleDate: adapter.date('2025-02-01', 'default'),
        onVisibleDateChange,
      });
      const newVisibleDate = adapter.date('2025-03-01', 'default');

      store.setVisibleDate(newVisibleDate, undefined, undefined, 'keyboard');

      const eventDetails = onVisibleDateChange.firstCall
        .args[1] as CalendarVisibleDateChangeEventDetails;
      expect(eventDetails.reason).to.equal('keyboard');
    });

    it('should support conditionally calling eventDetails.cancel() when uncontrolled', () => {
      const defaultVisibleDate = adapter.date('2025-02-01', 'default');
      const store = createStore(adapter, {
        defaultVisibleDate,
        onVisibleDateChange: (newDate, eventDetails) => {
          // Only allow navigating forward in time
          if (adapter.isBefore(newDate, defaultVisibleDate)) {
            eventDetails.cancel();
          }
        },
      });

      // Try to navigate backward - should be canceled
      const pastDate = adapter.date('2025-01-01', 'default');
      store.setVisibleDate(pastDate);
      expect(adapter.isEqual(store.state.visibleDate, defaultVisibleDate)).to.equal(true);

      // Navigate forward - should succeed
      const futureDate = adapter.date('2025-03-01', 'default');
      store.setVisibleDate(futureDate);
      expect(adapter.isEqual(store.state.visibleDate, futureDate)).to.equal(true);
    });
  });

  describe('navigationDirection', () => {
    it('should set navigationDirection to "next" when navigating forward', () => {
      const store = createStore(adapter, {
        defaultVisibleDate: adapter.date('2025-02-01', 'default'),
      });
      const newVisibleDate = adapter.date('2025-03-01', 'default');

      store.setVisibleDate(newVisibleDate);

      expect(store.state.navigationDirection).to.equal('next');
    });

    it('should set navigationDirection to "previous" when navigating backward', () => {
      const store = createStore(adapter, {
        defaultVisibleDate: adapter.date('2025-02-01', 'default'),
      });
      const newVisibleDate = adapter.date('2025-01-01', 'default');

      store.setVisibleDate(newVisibleDate);

      expect(store.state.navigationDirection).to.equal('previous');
    });

    it('should set navigationDirection to "none" when setting the same date', () => {
      const visibleDate = adapter.date('2025-02-01', 'default');
      const store = createStore(adapter, { defaultVisibleDate: visibleDate });

      // First set a different date to change direction
      store.setVisibleDate(adapter.date('2025-03-01', 'default'));
      expect(store.state.navigationDirection).to.equal('next');

      // Now set back to the same date
      store.setVisibleDate(adapter.date('2025-03-01', 'default'));
      expect(store.state.navigationDirection).to.equal('none');
    });

    it('should initialize with navigationDirection "none"', () => {
      const store = createStore(adapter, {
        defaultVisibleDate: adapter.date('2025-02-01', 'default'),
      });

      expect(store.state.navigationDirection).to.equal('none');
    });
  });

  describe('skipIfAlreadyVisible parameter', () => {
    it('should not update visibleDate when skipIfAlreadyVisible is true and no day grids are registered', () => {
      const onVisibleDateChange = spy();
      const store = createStore(adapter, {
        defaultVisibleDate: adapter.date('2025-02-01', 'default'),
        onVisibleDateChange,
      });
      const newVisibleDate = adapter.date('2025-03-01', 'default');

      // Without registered day grids, isDateCellVisible returns true
      store.setVisibleDate(newVisibleDate, undefined, undefined, undefined, true);

      // Should not update because skipIfAlreadyVisible is true and isDateCellVisible returns true
      expect(onVisibleDateChange.callCount).to.equal(0);
    });

    it('should update visibleDate when skipIfAlreadyVisible is false regardless of visibility', () => {
      const onVisibleDateChange = spy();
      const store = createStore(adapter, {
        defaultVisibleDate: adapter.date('2025-02-01', 'default'),
        onVisibleDateChange,
      });
      const newVisibleDate = adapter.date('2025-03-01', 'default');

      store.setVisibleDate(newVisibleDate);

      expect(onVisibleDateChange.callCount).to.equal(1);
      expect(adapter.isEqual(store.state.visibleDate, newVisibleDate)).to.equal(true);
    });
  });

  describe('visibleDate synchronization with value', () => {
    it('should update visibleDate when controlled value changes to a valid date', () => {
      const initialValue = adapter.date('2025-02-15', 'default');
      const store = createStore(adapter, { value: initialValue, visibleDate: initialValue });
      const manager = getDateManager(adapter);

      // Change the controlled value to a different month
      const newValue = adapter.date('2025-05-20', 'default');
      store.updateStateFromParameters(
        { value: newValue, visibleDate: store.state.visibleDate },
        adapter,
        manager,
      );

      // visibleDate should be updated to match the new value
      expect(adapter.isEqual(store.state.visibleDate, newValue)).to.equal(true);
    });

    it('should set navigationDirection when value changes and visibleDate is updated', () => {
      const initialValue = adapter.date('2025-02-15', 'default');
      const store = createStore(adapter, { value: initialValue, visibleDate: initialValue });
      const manager = getDateManager(adapter);

      // Change to a future value
      const futureValue = adapter.date('2025-05-20', 'default');
      store.updateStateFromParameters(
        { value: futureValue, visibleDate: store.state.visibleDate },
        adapter,
        manager,
      );

      expect(store.state.navigationDirection).to.equal('next');

      // Change to a past value
      const pastValue = adapter.date('2025-01-10', 'default');
      store.updateStateFromParameters(
        { value: pastValue, visibleDate: store.state.visibleDate },
        adapter,
        manager,
      );

      expect(store.state.navigationDirection).to.equal('previous');
    });
  });
});
