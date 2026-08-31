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

  it('passes extra arguments to a single combiner alongside the state', () => {
    type S = { value: number };
    const combiner = vi.fn((s: S, a1: number) => s.value + a1);

    const selector = createSelectorMemoized(combiner);
    const state: S = { value: 10 };

    // The single-function form wires [identity, argGetter, combiner], so the combiner
    // must still receive the state first.
    expect(selector(state, 5)).toBe(15);
    expect(selector(state, 5)).toBe(15);
    expect(combiner).toHaveBeenCalledTimes(1);

    expect(selector(state, 6)).toBe(16);
    expect(combiner).toHaveBeenCalledTimes(2);
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

    const selector = createSelectorMemoizedWithOptions({
      memoizeOptions: { maxSize: 2 },
      devModeChecks: { inputStabilityCheck: 'never', identityFunctionCheck: 'never' },
    })((state: S) => state.value, combiner);

    const state: S = { value: NaN };
    selector(state);
    // A derived state carries the same `__cacheKey__`, so the reselect instance is reused
    // and its equality decides whether the combiner re-runs. Passing the same reference
    // instead would short-circuit in `argsMemoize` before the equality is consulted.
    // NaN-valued inputs only hit the memo with `Object.is`; losing it to `===` as a side
    // effect of passing options would re-run the combiner.
    selector({ ...state });

    expect(combiner).toHaveBeenCalledTimes(1);
  });

  it('does not forward the lruMemoize defaults to a custom memoizer', () => {
    type S = { value: number };
    const seenOptions: unknown[] = [];
    const customMemoize = (fn: (...args: any[]) => any, ...memoizeOptions: unknown[]) => {
      seenOptions.push(...memoizeOptions);
      return fn;
    };

    const selector = createSelectorMemoizedWithOptions({
      memoize: customMemoize,
      // The pass-through memoizer above would trip reselect's stability warning.
      devModeChecks: { inputStabilityCheck: 'never', identityFunctionCheck: 'never' },
    })(
      (state: S) => state.value,
      (value: number) => ({ value }),
    );

    selector({ value: 1 });

    // The module defaults describe lruMemoize; a custom memoizer must not receive them.
    expect(seenOptions).toEqual([]);
  });

  it('does not break a custom memoizer that defaults its options parameter', () => {
    type S = { value: number };
    const customMemoize = (
      fn: (...args: any[]) => any,
      equalityCheck: (a: unknown, b: unknown) => boolean = Object.is,
    ) => {
      let lastArgs: any[] | null = null;
      let lastResult: any;
      return (...args: any[]) => {
        if (
          lastArgs !== null &&
          lastArgs.length === args.length &&
          args.every((arg, index) => equalityCheck(arg, lastArgs![index]))
        ) {
          return lastResult;
        }
        lastArgs = args;
        lastResult = fn(...args);
        return lastResult;
      };
    };

    const selector = createSelectorMemoizedWithOptions({ memoize: customMemoize })(
      (state: S) => state.value,
      (value: number) => ({ value }),
    );

    // Leaking the defaults passed the options object as `equalityCheck`, which threw here.
    expect(selector({ value: 1 })).toEqual({ value: 1 });
  });

  it('forwards custom memoizeOptions to a custom memoizer verbatim', () => {
    type S = { value: number };
    const seenOptions: unknown[] = [];
    const customOptions = { maxEntries: 4 };
    const customMemoize = (fn: (...args: any[]) => any, ...memoizeOptions: unknown[]) => {
      seenOptions.push(...memoizeOptions);
      return fn;
    };

    const selector = createSelectorMemoizedWithOptions({
      memoize: customMemoize,
      memoizeOptions: customOptions,
      devModeChecks: { inputStabilityCheck: 'never', identityFunctionCheck: 'never' },
    })(
      (state: S) => state.value,
      (value: number) => ({ value }),
    );

    selector({ value: 1 });

    expect(seenOptions).toEqual([customOptions]);
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
