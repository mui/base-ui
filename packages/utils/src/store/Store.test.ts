import { expect, vi } from 'vitest';
import { lruMemoize } from 'reselect';
import { Store } from './Store';
import { createSelector } from './createSelector';
import {
  createSelectorMemoized,
  createSelectorMemoizedWithOptions,
} from './createSelectorMemoized';

describe('Store', () => {
  describe('Store.create', () => {
    it('returns a Store instance seeded with the given state', () => {
      const store = Store.create({ value: 1, label: 'a' });

      expect(store).toBeInstanceOf(Store);
      expect(store.state).toEqual({ value: 1, label: 'a' });
    });

    it('produces an independent instance per call', () => {
      const first = Store.create({ value: 0 });
      const second = Store.create({ value: 0 });

      first.set('value', 1);

      expect(first.state.value).toBe(1);
      expect(second.state.value).toBe(0);
    });
  });
});

describe('createSelector', () => {
  it('returns the input function when called with a single selector', () => {
    const fn = (state: { value: number }) => state.value;
    const selector = createSelector(fn);

    expect(selector).toBe(fn);
    expect(selector({ value: 5 })).toBe(5);
  });

  it('supports six selectors plus a combiner', () => {
    type S = { a: number; b: number; c: number; d: number; e: number; f: number };
    const state: S = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 };

    const selector = createSelector(
      (s: S) => s.a,
      (s: S) => s.b,
      (s: S) => s.c,
      (s: S) => s.d,
      (s: S) => s.e,
      (s: S) => s.f,
      (a, b, c, d, e, f) => a + b + c + d + e + f,
    );

    expect(selector(state)).toBe(21);
  });

  it('supports seven selectors plus a combiner', () => {
    type S = { a: number; b: number; c: number; d: number; e: number; f: number; g: number };
    const state: S = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7 };

    const selector = createSelector(
      (s: S) => s.a,
      (s: S) => s.b,
      (s: S) => s.c,
      (s: S) => s.d,
      (s: S) => s.e,
      (s: S) => s.f,
      (s: S) => s.g,
      (a, b, c, d, e, f, g) => a + b + c + d + e + f + g,
    );

    expect(selector(state)).toBe(28);
  });

  it('passes extra args through to every input selector and to the combiner', () => {
    type S = { value: number };
    const state: S = { value: 10 };

    const selector = createSelector(
      (s: S, multiplier: number) => s.value * multiplier,
      (s: S, _multiplier: number, offset: number) => s.value + offset,
      (scaled, shifted, multiplier, offset) => ({ scaled, shifted, multiplier, offset }),
    );

    expect(selector(state, 3, 7)).toEqual({ scaled: 30, shifted: 17, multiplier: 3, offset: 7 });
  });

  it('throws when given more selectors than are supported', () => {
    const fn = (s: any) => s;

    expect(() =>
      // @ts-expect-error intentionally over the supported arity
      createSelector(fn, fn, fn, fn, fn, fn, fn, fn, fn),
    ).toThrow('Unsupported number of selectors');
  });
});

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
});
