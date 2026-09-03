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

// A composed combiner takes at most three arguments beyond the input selector results,
// since the runtime forwards only three.
createSelector(input, (value, x1: number, x2: number, x3: number) => value + x1 + x2 + x3);

// prettier-ignore
// @ts-expect-error A composed combiner cannot take a fourth extra argument.
createSelector(input, (value, x1: number, x2: number, x3: number, x4: number) => value + x4);

// prettier-ignore
// @ts-expect-error The limit counts the arguments left after the input selector results.
createSelector(input, input, (v1, v2, x1: number, x2: number, x3: number, x4: number) => v1 + v2 + x4);

// The single-function form is returned verbatim, so it keeps its own signature and is not
// bound by the extra-argument limit.
{
  const constant = createSelector(() => 42);
  expectType<number, ReturnType<typeof constant>>(constant());
}
createSelector((s: State, x1: number, x2: number, x3: number, x4: number) => s.value + x4);

// prettier-ignore
// @ts-expect-error Combiners cannot have optional parameters.
createSelector(input, (value, x1?: number) => value + (x1 ?? 0));
