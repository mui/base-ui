import { expect } from 'vitest';
import { createSelector } from './createSelector';

describe('createSelector', () => {
  it('returns the input function when called with a single selector', () => {
    const fn = (state: { value: number }) => state.value;
    const selector = createSelector(fn);

    expect(selector).toBe(fn);
    expect(selector({ value: 5 })).toBe(5);
  });

  it('supports one input selector plus a combiner', () => {
    type S = { a: number };
    const state: S = { a: 1 };

    const selector = createSelector(
      (s: S) => s.a,
      (a) => a + 1,
    );

    expect(selector(state)).toBe(2);
  });

  it('supports six input selectors plus a combiner', () => {
    type S = { v1: number; v2: number; v3: number; v4: number; v5: number; v6: number };
    const state: S = { v1: 1, v2: 2, v3: 4, v4: 8, v5: 16, v6: 32 };

    const selector = createSelector(
      (s: S) => s.v1,
      (s: S) => s.v2,
      (s: S) => s.v3,
      (s: S) => s.v4,
      (s: S) => s.v5,
      (s: S) => s.v6,
      (v1, v2, v3, v4, v5, v6) => v1 + v2 + v3 + v4 + v5 + v6,
    );

    expect(selector(state)).toBe(63);
  });

  it('supports seven input selectors plus a combiner', () => {
    type S = {
      v1: number;
      v2: number;
      v3: number;
      v4: number;
      v5: number;
      v6: number;
      v7: number;
    };
    const state: S = { v1: 1, v2: 2, v3: 4, v4: 8, v5: 16, v6: 32, v7: 64 };

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

    expect(selector(state)).toBe(127);
  });

  it('throws when given one more than the maximum (eight input selectors plus a combiner)', () => {
    const fn = (s: any) => s;

    expect(
      // @ts-expect-error nine functions exceed the supported arity
      () => createSelector(fn, fn, fn, fn, fn, fn, fn, fn, fn),
    ).toThrow('Unsupported number of selectors');
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
});
