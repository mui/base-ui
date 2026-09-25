import { expectType } from '../testUtils';
import { createSelector } from './createSelector';
import type { Store } from './Store';
import { ReactStore } from './ReactStore';

interface TestState {
  count: number | undefined;
  text: string;
}

const selectors = {
  count: createSelector((state: TestState) => state.count),
  text: createSelector((state: TestState) => state.text),
  textLongerThan(state: TestState, length: number) {
    return state.text.length > length;
  },
  textLengthBetween(state: TestState, minLength: number, maxLength: number) {
    return state.text.length >= minLength && state.text.length <= maxLength;
  },
};

const store = new ReactStore<TestState, Record<string, never>, typeof selectors>(
  { count: 0, text: '' },
  undefined,
  selectors,
);

store.set('text', 'next');
store.set('count', undefined);
store.update({ text: 'next' });
store.update({ count: undefined });
store.useSyncedValue('text', 'next');
store.useSyncedValues({ text: 'next' });
store.useControlledProp('text', 'next');

const setText = store.useStateSetter('text');
setText('next');

// @ts-expect-error `text` only accepts strings.
store.set('text', 1);
// @ts-expect-error `text` does not accept undefined.
store.set('text', undefined);
// @ts-expect-error Store values must match their corresponding keys.
store.update({ text: undefined });
// @ts-expect-error Store updates cannot contain unknown keys.
store.update({ unknown: true });
// @ts-expect-error Synced values must match their corresponding keys.
store.useSyncedValue('text', 1);
// @ts-expect-error Synced values cannot explicitly be undefined unless the state field allows it.
store.useSyncedValues({ text: undefined });
// @ts-expect-error Controlled values must match their corresponding keys.
store.useControlledProp('text', 1);
// @ts-expect-error State setters only accept the selected field's value type.
setText(1);

const count = store.select('count');
expectType<number | undefined, typeof count>(count);

const text = store.select('text');
expectType<string, typeof text>(text);

const isTextLongerThan5 = store.select('textLongerThan', 5);
expectType<boolean, typeof isTextLongerThan5>(isTextLongerThan5);

const isTextLengthBetween3And10 = store.select('textLengthBetween', 3, 10);
expectType<boolean, typeof isTextLengthBetween3And10>(isTextLengthBetween3And10);

const countReactive = store.useState('count');
expectType<number | undefined, typeof countReactive>(countReactive);

const textReactive = store.useState('text');
expectType<string, typeof textReactive>(textReactive);

const isTextLongerThan7Reactive = store.useState('textLongerThan', 7);
expectType<boolean, typeof isTextLongerThan7Reactive>(isTextLongerThan7Reactive);

const isTextLengthBetween2And8Reactive = store.useState('textLengthBetween', 2, 8);
expectType<boolean, typeof isTextLengthBetween2And8Reactive>(isTextLengthBetween2And8Reactive);

// incorrect calls:

// @ts-expect-error
store.select();
// @ts-expect-error
store.select('count', 1);
// @ts-expect-error
store.select('textLongerThan');
// @ts-expect-error
store.select('textLengthBetween', 1);
// @ts-expect-error
store.select('textLongerThan', 2, 3);

// @ts-expect-error
store.useState();
// @ts-expect-error
store.useState('count', 1);
// @ts-expect-error
store.useState('textLongerThan');
// @ts-expect-error
store.useState('textLengthBetween', 1);
// @ts-expect-error
store.useState('textLongerThan', 2, 3);

const unsubscribeFromCount = store.observe('count', (newValue, oldValue) => {
  expectType<number | undefined, typeof newValue>(newValue);
  expectType<number | undefined, typeof oldValue>(oldValue);
});
expectType<() => void, typeof unsubscribeFromCount>(unsubscribeFromCount);

const unsubscribeFromSelector = store.observe(
  (state) => state.text.length,
  (newValue, oldValue) => {
    expectType<number, typeof newValue>(newValue);
    expectType<number, typeof oldValue>(oldValue);
  },
);
expectType<() => void, typeof unsubscribeFromSelector>(unsubscribeFromSelector);

const mismatchedListener = (newValue: string) => {
  expectType<string, typeof newValue>(newValue);
};
// @ts-expect-error listener must match selector return type
store.observe((state) => state.text.length, mismatchedListener);

// Calling create() on the generic class constructs a ReactStore at runtime, but the
// inferred instance type degrades to the base Store — a known limitation (see Store.create).
{
  const degraded = ReactStore.create({ count: 0 });
  expectType<Store<{ count: number }>, typeof degraded>(degraded);
}
