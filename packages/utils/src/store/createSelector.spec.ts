import { expectType } from '../testUtils';
import { createSelector } from './createSelector';

interface State {
  value: number;
  label: string;
}

declare const state: State;
const input = (s: State) => s.value;

// Combiners receive the input selector results plus up to three additional arguments.
{
  const selector = createSelector(
    (s: State) => s.value,
    (s: State) => s.label,
    (value, label, x1: number, x2: string, x3: boolean) => `${value}${label}${x1}${x2}${x3}`,
  );
  expectType<string, ReturnType<typeof selector>>(selector(state, 1, 'a', true));
}

// Seven input selectors go through the unrolled fast paths.
createSelector(
  input,
  input,
  input,
  input,
  input,
  input,
  input,
  (v1, v2, v3, v4, v5, v6, v7) => v1 + v2 + v3 + v4 + v5 + v6 + v7,
);

// prettier-ignore
// @ts-expect-error Eight input selectors are not supported.
createSelector(input, input, input, input, input, input, input, input, (v1: number) => v1);

// The single-function form is returned verbatim, so it keeps its own signature.
{
  const constant = createSelector(() => 42);
  expectType<number, ReturnType<typeof constant>>(constant());
}
createSelector((s: State, x1: number, x2: number, x3: number, x4: number) => s.value + x4);

// prettier-ignore
// @ts-expect-error Combiners cannot have optional parameters.
createSelector(input, (value, x1?: number) => value + (x1 ?? 0));
