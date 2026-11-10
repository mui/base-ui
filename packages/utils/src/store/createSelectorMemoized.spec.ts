import {
  createSelectorMemoized,
  createSelectorMemoizedWithOptions,
} from './createSelectorMemoized';

interface State {
  value: number;
  label: string;
}

declare const state: State;
const input = (s: State) => s.value;

// The single-function form always requires the state argument when called.
{
  const constant = createSelectorMemoized(() => 42);
  constant(state);
  // @ts-expect-error The memoized selector requires the state to cache the result.
  constant();
}

// The single-function form accepts the state plus up to three additional arguments.
createSelectorMemoized((s: State, x1: number, x2: number, x3: number) => s.value + x1 + x2 + x3);

// prettier-ignore
// @ts-expect-error The single-function form accepts at most three additional arguments.
createSelectorMemoized((s: State, x1: number, x2: number, x3: number, x4: number) => s.value + x4);

// The input selector count is unbounded.
createSelectorMemoized(
  input,
  input,
  input,
  input,
  input,
  input,
  input,
  input,
  (v1, v2, v3, v4, v5, v6, v7, v8) => v1 + v2 + v3 + v4 + v5 + v6 + v7 + v8,
);

// The options follow the reselect createSelector options shape.
createSelectorMemoizedWithOptions({
  memoizeOptions: { resultEqualityCheck: (a: unknown, b: unknown) => a === b },
});

// prettier-ignore
// @ts-expect-error Memoize options must match the memoizer's signature.
createSelectorMemoizedWithOptions({ memoizeOptions: { equalityCheck: 123 } });

// prettier-ignore
// @ts-expect-error Unknown options are rejected.
createSelectorMemoizedWithOptions({ unknownOption: true });
