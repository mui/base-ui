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

    it('constructs an instance of the subclass it is called on', () => {
      class SubStore extends Store<{ count: number }> {
        increment() {
          this.set('count', this.state.count + 1);
        }
      }

      const store = SubStore.create({ count: 1 });

      expect(store).toBeInstanceOf(SubStore);
      store.increment();
      expect(store.state.count).toBe(2);
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

  it('supports the minimum of one input selector plus a combiner', () => {
    type S = { a: number };
    const state: S = { a: 1 };

    const selector = createSelector(
      (s: S) => s.a,
      (a) => a + 1,
    );

    expect(selector(state)).toBe(2);
  });

  it('supports the maximum of seven input selectors plus a combiner', () => {
    type S = { v1: number; v2: number; v3: number; v4: number; v5: number; v6: number; v7: number };
    const state: S = { v1: 1, v2: 2, v3: 3, v4: 4, v5: 5, v6: 6, v7: 7 };

    const selector = createSelector(
      (s: S) => s.v1,
      (s: S) => s.v2,
      (s: S) => s.v3,
      (s: S) => s.v4,
      (s: S) => s.v5,
      (s: S) => s.v6,
      (s: S) => s.v7,
      (v1, v2, v3, v4, v5, v6, v7) => v1 + v2 + v3 + v4 + v5 + v6 + v7,
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

  it('throws when given one more than the maximum (eight input selectors plus a combiner)', () => {
    const fn = (s: any) => s;

    expect(
      // @ts-expect-error nine functions exceed the supported arity
      () => createSelector(fn, fn, fn, fn, fn, fn, fn, fn, fn),
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
