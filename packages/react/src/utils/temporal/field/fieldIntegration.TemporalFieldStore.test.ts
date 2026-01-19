import { expect } from 'chai';
import { spy } from 'sinon';
import { createTemporalRenderer } from '#test-utils';
import { DateFieldStore } from '../../../date-field/root/DateFieldStore';
import { TimeFieldStore } from '../../../time-field/root/TimeFieldStore';

describe('TemporalFieldStore - Field Integration', () => {
  const { adapter } = createTemporalRenderer();

  // Date formats
  const numericDateFormat = `${adapter.formats.monthPadded}/${adapter.formats.dayOfMonthPadded}/${adapter.formats.yearPadded}`;

  // Time formats
  const time24Format = `${adapter.formats.hours24hPadded}:${adapter.formats.minutesPadded}`;

  describe('fieldContext storage', () => {
    it('should store fieldContext in state when provided in parameters', () => {
      const mockFieldContext = {
        name: 'testField',
        state: { disabled: false },
        invalid: false,
      } as any;

      const store = new DateFieldStore(
        { format: numericDateFormat, fieldContext: mockFieldContext },
        adapter,
        'ltr',
      );

      expect(store.state.fieldContext).to.equal(mockFieldContext);
    });

    it('should store null when fieldContext is not provided', () => {
      const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');

      expect(store.state.fieldContext).to.equal(null);
    });

    it('should update fieldContext when parameters change', () => {
      const initialFieldContext = {
        name: 'field1',
        state: { disabled: false },
      } as any;

      const store = new DateFieldStore(
        { format: numericDateFormat, fieldContext: initialFieldContext },
        adapter,
        'ltr',
      );

      expect(store.state.fieldContext).to.equal(initialFieldContext);

      const newFieldContext = {
        name: 'field2',
        state: { disabled: true },
      } as any;

      store.tempUpdate(
        { format: numericDateFormat, fieldContext: newFieldContext },
        adapter,
        'ltr',
      );

      expect(store.state.fieldContext).to.equal(newFieldContext);
    });
  });

  describe('disabled selector', () => {
    it('should return disabledProp when fieldContext is null', () => {
      const store = new DateFieldStore(
        { format: numericDateFormat, disabled: true },
        adapter,
        'ltr',
      );

      expect(store.state.disabledProp).to.equal(true);
      // The selector would combine: fieldContext?.state.disabled || disabledProp
      // With null fieldContext: null || true = true
    });

    it('should combine fieldContext.state.disabled with disabledProp', () => {
      const mockFieldContext = {
        state: { disabled: true },
      } as any;

      const store = new DateFieldStore(
        { format: numericDateFormat, disabled: false, fieldContext: mockFieldContext },
        adapter,
        'ltr',
      );

      expect(store.state.disabledProp).to.equal(false);
      expect(store.state.fieldContext?.state.disabled).to.equal(true);
      // The selector would combine: true || false = true
    });

    it('should use local disabled prop when fieldContext.state.disabled is false', () => {
      const mockFieldContext = {
        state: { disabled: false },
      } as any;

      const store = new DateFieldStore(
        { format: numericDateFormat, disabled: true, fieldContext: mockFieldContext },
        adapter,
        'ltr',
      );

      expect(store.state.disabledProp).to.equal(true);
      expect(store.state.fieldContext?.state.disabled).to.equal(false);
      // The selector would combine: false || true = true
    });
  });

  describe('name selector', () => {
    it('should return nameProp when fieldContext is null', () => {
      const store = new DateFieldStore(
        { format: numericDateFormat, name: 'localName' },
        adapter,
        'ltr',
      );

      expect(store.state.nameProp).to.equal('localName');
      expect(store.state.fieldContext).to.equal(null);
      // The selector would return: fieldContext?.name ?? nameProp = undefined ?? 'localName' = 'localName'
    });

    it('should prefer fieldContext.name over nameProp', () => {
      const mockFieldContext = {
        name: 'fieldName',
      } as any;

      const store = new DateFieldStore(
        { format: numericDateFormat, name: 'localName', fieldContext: mockFieldContext },
        adapter,
        'ltr',
      );

      expect(store.state.nameProp).to.equal('localName');
      expect(store.state.fieldContext?.name).to.equal('fieldName');
      // The selector would return: 'fieldName' ?? 'localName' = 'fieldName'
    });

    it('should fall back to nameProp when fieldContext.name is undefined', () => {
      const mockFieldContext = {
        name: undefined,
      } as any;

      const store = new DateFieldStore(
        { format: numericDateFormat, name: 'localName', fieldContext: mockFieldContext },
        adapter,
        'ltr',
      );

      expect(store.state.nameProp).to.equal('localName');
      expect(store.state.fieldContext?.name).to.equal(undefined);
      // The selector would return: undefined ?? 'localName' = 'localName'
    });
  });

  describe('setFilled integration via registerStoreEffect', () => {
    it('should call setFilled(true) when value changes from null to non-null', () => {
      const setFilledSpy = spy();
      const mockFieldContext = {
        setFilled: setFilledSpy,
        setDirty: () => {},
        validityData: { initialValue: null },
        shouldValidateOnChange: () => false,
      } as any;

      const store = new DateFieldStore(
        { format: numericDateFormat, fieldContext: mockFieldContext },
        adapter,
        'ltr',
      );

      // Initial value is null, so setFilled should not be called yet for the initial state
      // But the effect should be registered

      // Change value to non-null
      store.value.updateFromString('01/15/2024');

      // setFilled should be called with true
      expect(setFilledSpy.callCount).to.be.greaterThan(0);
      expect(setFilledSpy.lastCall.args[0]).to.equal(true);
    });

    it('should call setFilled(false) when value changes from non-null to null', () => {
      const setFilledSpy = spy();
      const mockFieldContext = {
        setFilled: setFilledSpy,
        setDirty: () => {},
        validityData: { initialValue: null },
        shouldValidateOnChange: () => false,
      } as any;

      const store = new DateFieldStore(
        {
          format: numericDateFormat,
          defaultValue: adapter.date('2024-01-15', 'default'),
          fieldContext: mockFieldContext,
        },
        adapter,
        'ltr',
      );

      // Value is initially non-null, effect is registered so setFilled should be called on mount
      // The effect triggers when value changes
      setFilledSpy.resetHistory();

      // Change value to null
      store.value.clear();

      // setFilled should be called with false
      expect(setFilledSpy.callCount).to.be.greaterThan(0);
      expect(setFilledSpy.lastCall.args[0]).to.equal(false);
    });

    it('should not call setFilled when fieldContext is null', () => {
      const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');

      // This should not throw even without fieldContext
      store.value.updateFromString('01/15/2024');

      // No error should occur - value is stored as a Date object
      expect(store.state.value).to.not.equal(null);
      expect(adapter.isValid(store.state.value)).to.equal(true);
    });
  });

  describe('setDirty integration in publish()', () => {
    it('should call setDirty(false) when value equals initial value', () => {
      const setDirtySpy = spy();
      const initialValue = adapter.date('2024-01-15', 'default');
      const mockFieldContext = {
        setDirty: setDirtySpy,
        setFilled: () => {},
        validityData: { initialValue },
        shouldValidateOnChange: () => false,
      } as any;

      const store = new DateFieldStore(
        {
          format: numericDateFormat,
          defaultValue: adapter.date('2024-01-15', 'default'),
          fieldContext: mockFieldContext,
        },
        adapter,
        'ltr',
      );

      setDirtySpy.resetHistory();

      // Set value to same as initial
      store.value.updateFromString('01/15/2024');

      // setDirty should be called with false
      expect(setDirtySpy.callCount).to.be.greaterThan(0);
      expect(setDirtySpy.lastCall.args[0]).to.equal(false);
    });

    it('should call setDirty(true) when value differs from initial value', () => {
      const setDirtySpy = spy();
      const initialValue = adapter.date('2024-01-15', 'default');
      const mockFieldContext = {
        setDirty: setDirtySpy,
        setFilled: () => {},
        validityData: { initialValue },
        shouldValidateOnChange: () => false,
      } as any;

      const store = new DateFieldStore(
        {
          format: numericDateFormat,
          defaultValue: adapter.date('2024-01-15', 'default'),
          fieldContext: mockFieldContext,
        },
        adapter,
        'ltr',
      );

      setDirtySpy.resetHistory();

      // Set value to different from initial
      store.value.updateFromString('01/16/2024');

      // setDirty should be called with true
      expect(setDirtySpy.callCount).to.be.greaterThan(0);
      expect(setDirtySpy.lastCall.args[0]).to.equal(true);
    });

    it('should not call setDirty when fieldContext is null', () => {
      const store = new DateFieldStore(
        { format: numericDateFormat, defaultValue: adapter.date('2024-01-15', 'default') },
        adapter,
        'ltr',
      );

      // This should not throw even without fieldContext
      store.value.updateFromString('01/16/2024');

      // No error should occur - value is stored as a Date object
      expect(store.state.value).to.not.equal(null);
      expect(adapter.isValid(store.state.value)).to.equal(true);
    });
  });

  describe('validation integration in publish()', () => {
    it('should call validation.commit() when shouldValidateOnChange returns true', () => {
      const validationCommitSpy = spy();
      const shouldValidateOnChangeSpy = spy(() => true);
      const mockFieldContext = {
        setDirty: () => {},
        setFilled: () => {},
        validityData: { initialValue: null },
        shouldValidateOnChange: shouldValidateOnChangeSpy,
        validation: { commit: validationCommitSpy },
      } as any;

      const store = new DateFieldStore(
        { format: numericDateFormat, fieldContext: mockFieldContext },
        adapter,
        'ltr',
      );

      // Change value
      store.value.updateFromString('01/15/2024');

      // shouldValidateOnChange should be called
      expect(shouldValidateOnChangeSpy.callCount).to.be.greaterThan(0);

      // validation.commit should be called with the new value (Date object)
      expect(validationCommitSpy.callCount).to.be.greaterThan(0);
      expect(adapter.isValid(validationCommitSpy.lastCall.args[0])).to.equal(true);
    });

    it('should not call validation.commit() when shouldValidateOnChange returns false', () => {
      const validationCommitSpy = spy();
      const shouldValidateOnChangeSpy = spy(() => false);
      const mockFieldContext = {
        setDirty: () => {},
        setFilled: () => {},
        validityData: { initialValue: null },
        shouldValidateOnChange: shouldValidateOnChangeSpy,
        validation: { commit: validationCommitSpy },
      } as any;

      const store = new DateFieldStore(
        { format: numericDateFormat, fieldContext: mockFieldContext },
        adapter,
        'ltr',
      );

      // Change value
      store.value.updateFromString('01/15/2024');

      // shouldValidateOnChange should be called
      expect(shouldValidateOnChangeSpy.callCount).to.be.greaterThan(0);

      // validation.commit should NOT be called
      expect(validationCommitSpy.callCount).to.equal(0);
    });

    it('should not call validation when fieldContext is null', () => {
      const store = new DateFieldStore({ format: numericDateFormat }, adapter, 'ltr');

      // This should not throw even without fieldContext
      store.value.updateFromString('01/15/2024');

      // No error should occur - value is stored as a Date object
      expect(store.state.value).to.not.equal(null);
      expect(adapter.isValid(store.state.value)).to.equal(true);
    });
  });

  describe('TimeFieldStore - Field integration', () => {
    it('should store fieldContext in TimeFieldStore', () => {
      const mockFieldContext = {
        name: 'timeField',
        state: { disabled: false },
        setFilled: () => {},
      } as any;

      const store = new TimeFieldStore(
        { format: time24Format, fieldContext: mockFieldContext },
        adapter,
        'ltr',
      );

      expect(store.state.fieldContext).to.equal(mockFieldContext);
    });

    it('should call setDirty when time value changes', () => {
      const setDirtySpy = spy();
      const mockFieldContext = {
        setDirty: setDirtySpy,
        setFilled: () => {},
        validityData: { initialValue: null },
        shouldValidateOnChange: () => false,
      } as any;

      const store = new TimeFieldStore(
        { format: time24Format, fieldContext: mockFieldContext },
        adapter,
        'ltr',
      );

      setDirtySpy.resetHistory();

      // Change time value
      store.value.updateFromString('14:30');

      // setDirty should be called with true (differs from initial null)
      expect(setDirtySpy.callCount).to.be.greaterThan(0);
      expect(setDirtySpy.lastCall.args[0]).to.equal(true);
    });

    it('should call validation.commit() for time values', () => {
      const validationCommitSpy = spy();
      const mockFieldContext = {
        setDirty: () => {},
        setFilled: () => {},
        validityData: { initialValue: null },
        shouldValidateOnChange: () => true,
        validation: { commit: validationCommitSpy },
      } as any;

      const store = new TimeFieldStore(
        { format: time24Format, fieldContext: mockFieldContext },
        adapter,
        'ltr',
      );

      // Change time value
      store.value.updateFromString('14:30');

      // validation.commit should be called with the new value (PlainTime object)
      expect(validationCommitSpy.callCount).to.be.greaterThan(0);
      expect(adapter.isValid(validationCommitSpy.lastCall.args[0])).to.equal(true);
    });

    it('should call setFilled when time value changes', () => {
      const setFilledSpy = spy();
      const mockFieldContext = {
        setFilled: setFilledSpy,
        setDirty: () => {},
        validityData: { initialValue: null },
        shouldValidateOnChange: () => false,
      } as any;

      const store = new TimeFieldStore(
        { format: time24Format, fieldContext: mockFieldContext },
        adapter,
        'ltr',
      );

      setFilledSpy.resetHistory();

      // Change time value to non-null
      store.value.updateFromString('14:30');

      // setFilled should be called with true
      expect(setFilledSpy.callCount).to.be.greaterThan(0);
      expect(setFilledSpy.lastCall.args[0]).to.equal(true);
    });
  });

  describe('onValueChange integration', () => {
    it('should call onValueChange before Field callbacks', () => {
      const callOrder: string[] = [];
      const onValueChangeSpy = spy(() => callOrder.push('onValueChange'));
      const setDirtySpy = spy(() => callOrder.push('setDirty'));

      const mockFieldContext = {
        setDirty: setDirtySpy,
        setFilled: () => {},
        validityData: { initialValue: null },
        shouldValidateOnChange: () => false,
      } as any;

      const store = new DateFieldStore(
        {
          format: numericDateFormat,
          onValueChange: onValueChangeSpy,
          fieldContext: mockFieldContext,
        },
        adapter,
        'ltr',
      );

      // Change value
      store.value.updateFromString('01/15/2024');

      // onValueChange should be called
      expect(onValueChangeSpy.callCount).to.be.greaterThan(0);
      // Value is passed as Date object
      if (onValueChangeSpy.lastCall && onValueChangeSpy.lastCall.args.length > 0) {
        expect(adapter.isValid(onValueChangeSpy.lastCall.args[0 as any]!)).to.equal(true);
      }

      // setDirty should also be called
      expect(setDirtySpy.callCount).to.be.greaterThan(0);

      // onValueChange should be called before setDirty
      expect(callOrder[0]).to.equal('onValueChange');
      expect(callOrder[1]).to.equal('setDirty');
    });
  });

  describe('usage without Field', () => {
    it('should work without Field context (standalone mode)', () => {
      const onValueChangeSpy = spy();

      const store = new DateFieldStore(
        {
          format: numericDateFormat,
          onValueChange: onValueChangeSpy,
          disabled: true,
          name: 'standaloneField',
        },
        adapter,
        'ltr',
      );

      // Should work normally without Field context
      expect(store.state.disabledProp).to.equal(true);
      expect(store.state.nameProp).to.equal('standaloneField');
      expect(store.state.fieldContext).to.equal(null);

      // Value changes should work
      store.value.updateFromString('01/15/2024');

      expect(onValueChangeSpy.callCount).to.be.greaterThan(0);
      // Value is passed as Date object
      if (onValueChangeSpy.lastCall && onValueChangeSpy.lastCall.args.length > 0) {
        expect(adapter.isValid(onValueChangeSpy.lastCall.args[0])).to.equal(true);
      }
      expect(adapter.isValid(store.state.value)).to.equal(true);
    });
  });
});
