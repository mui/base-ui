import { expect, vi } from 'vitest';
import { lruMemoize } from 'reselect';
import {
  createSelectorMemoized,
  createSelectorMemoizedWithOptions,
} from './createSelectorMemoized';

describe('createSelectorMemoized', () => {
  it('uses an identity input selector when only a combiner is provided', () => {
    type S = { value: number };
    const combiner = vi.fn((s: S) => ({ doubled: s.value * 2 }));

    const selector = createSelectorMemoized(combiner);

    const state: S = { value: 4 };
    expect(selector(state)).toEqual({ doubled: 8 });
    expect(combiner).toHaveBeenCalledTimes(1);

    expect(selector(state)).toEqual({ doubled: 8 });
    expect(combiner).toHaveBeenCalledTimes(1);
  });

  it('supports a zero-parameter combiner called with the state', () => {
    const selector = createSelectorMemoized(() => 42);

    expect(selector({})).toBe(42);
  });

  it('re-runs the combiner when input selector results change', () => {
    type S = { a: number; b: number };
    const combiner = vi.fn((a: number, b: number) => ({ sum: a + b }));

    const selector = createSelectorMemoized(
      (state: S) => state.a,
      (state: S) => state.b,
      combiner,
    );

    const state: S = { a: 1, b: 2 };
    expect(selector(state)).toEqual({ sum: 3 });
    expect(combiner).toHaveBeenCalledTimes(1);

    expect(selector(state)).toEqual({ sum: 3 });
    expect(combiner).toHaveBeenCalledTimes(1);

    const next: S = { a: 5, b: 2 };
    expect(selector(next)).toEqual({ sum: 7 });
    expect(combiner).toHaveBeenCalledTimes(2);
  });

  it('caches separately per state identity', () => {
    type S = { value: number };
    const combiner = vi.fn((value: number) => ({ value }));

    const selector = createSelectorMemoized((state: S) => state.value, combiner);

    const a: S = { value: 1 };
    const b: S = { value: 1 };

    selector(a);
    selector(b);

    expect(combiner).toHaveBeenCalledTimes(2);
  });

  it('passes one extra argument to the combiner and memoizes on it', () => {
    type S = { value: number };
    const combiner = vi.fn((value: number, x1: number) => value + x1);

    const selector = createSelectorMemoized((state: S) => state.value, combiner);
    const state: S = { value: 10 };

    expect(selector(state, 1)).toBe(11);
    expect(combiner).toHaveBeenCalledTimes(1);

    expect(selector(state, 1)).toBe(11);
    expect(combiner).toHaveBeenCalledTimes(1);

    expect(selector(state, 2)).toBe(12);
    expect(combiner).toHaveBeenCalledTimes(2);
  });

  it('passes two extra arguments to the combiner', () => {
    type S = { value: number };
    const combiner = vi.fn((value: number, x1: number, x2: number) => value + x1 + x2);

    const selector = createSelectorMemoized((state: S) => state.value, combiner);
    const state: S = { value: 10 };

    expect(selector(state, 1, 2)).toBe(13);
    expect(selector(state, 1, 2)).toBe(13);
    expect(combiner).toHaveBeenCalledTimes(1);

    expect(selector(state, 1, 5)).toBe(16);
    expect(combiner).toHaveBeenCalledTimes(2);
  });

  it('passes three extra arguments to the combiner', () => {
    type S = { value: number };
    const combiner = vi.fn(
      (value: number, x1: number, x2: number, x3: number) => value + x1 + x2 + x3,
    );

    const selector = createSelectorMemoized((state: S) => state.value, combiner);
    const state: S = { value: 10 };

    expect(selector(state, 1, 2, 3)).toBe(16);
    expect(selector(state, 1, 2, 3)).toBe(16);
    expect(combiner).toHaveBeenCalledTimes(1);

    expect(selector(state, 1, 2, 7)).toBe(20);
    expect(combiner).toHaveBeenCalledTimes(2);
  });

  it('throws when the combiner takes more than three extra arguments', () => {
    expect(() =>
      createSelectorMemoized(
        (s: { value: number }) => s.value,
        // @ts-expect-error four extra arguments exceed the fixed dispatch slots
        (value: number, x1: number, x2: number, x3: number, x4: number) =>
          value + x1 + x2 + x3 + x4,
      ),
    ).toThrow('Unsupported number of arguments');
  });

  it('throws when Function.length under-reports the combiner parameters', () => {
    expect(() =>
      createSelectorMemoized(
        (s: { a: number }) => s.a,
        (s: { a: number }) => s.a * 2,
        (first: number, ...rest: number[]) => first + rest.length,
      ),
    ).toThrow('Unsupported number of arguments');
  });
});

describe('createSelectorMemoizedWithOptions', () => {
  it('produces a working factory when no options are provided', () => {
    type S = { value: number };
    const combiner = vi.fn((value: number) => ({ value }));

    const selector = createSelectorMemoizedWithOptions()((state: S) => state.value, combiner);

    const state: S = { value: 3 };
    expect(selector(state)).toEqual({ value: 3 });
    expect(selector(state)).toEqual({ value: 3 });
    expect(combiner).toHaveBeenCalledTimes(1);
  });

  it('forwards options through to the underlying reselect creator', () => {
    type S = { value: number };
    const inputSelector = vi.fn((state: S) => state.value);
    const combiner = vi.fn((value: number) => ({ value }));

    const selector = createSelectorMemoizedWithOptions({
      argsMemoize: lruMemoize,
      argsMemoizeOptions: { equalityCheck: () => false, maxSize: 1 },
      devModeChecks: { inputStabilityCheck: 'never', identityFunctionCheck: 'never' },
    })(inputSelector, combiner);

    const state: S = { value: 7 };
    selector(state);
    const callsAfterFirst = inputSelector.mock.calls.length;
    selector(state);

    // The custom argsMemoize never considers args equal, so input selectors
    // re-run on every call (defaults would have produced a cache hit instead).
    expect(inputSelector.mock.calls.length).toBeGreaterThan(callsAfterFirst);
    // The combiner result is still memoized because the input value is unchanged.
    expect(combiner).toHaveBeenCalledTimes(1);
  });

  it('merges object memoizeOptions over the Object.is equality default', () => {
    type S = { value: number };
    const combiner = vi.fn((value: number) => ({ value }));

    const selector = createSelectorMemoizedWithOptions({ memoizeOptions: { maxSize: 2 } })(
      (state: S) => state.value,
      combiner,
    );

    // NaN-valued inputs only hit the memo with Object.is; replacing the default
    // equality with `===` as a side effect of passing options would re-run the combiner.
    const state: S = { value: NaN };
    selector(state);
    selector(state);

    expect(combiner).toHaveBeenCalledTimes(1);
  });

  it('preserves the result reference with a resultEqualityCheck option', () => {
    type S = { value: number };

    const selector = createSelectorMemoizedWithOptions({
      memoizeOptions: {
        resultEqualityCheck: (a: unknown, b: unknown) =>
          (a as { value: number }).value === (b as { value: number }).value,
      },
    })(
      (state: S) => state.value,
      (value: number, _tag: number) => ({ value }),
    );

    const state: S = { value: 3 };
    const first = selector(state, 1);
    const second = selector(state, 2);

    expect(second).toBe(first);
  });
});
