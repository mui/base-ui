import { expect } from 'vitest';
import { createSelectorMemoized } from './createSelectorMemoized';

describe('createSelectorMemoized', () => {
  it('returns the same result for the same state', () => {
    const selector = createSelectorMemoized(() => []);
    const state = {};

    expect(selector(state)).toBe(selector(state));
  });

  it('returns different results for different states', () => {
    const selector = createSelectorMemoized(() => []);

    expect(selector({})).not.toBe(selector({}));
  });

  it('does not clear the cache of one state when another state is passed', () => {
    const selector = createSelectorMemoized(() => []);
    const stateA = {};
    const stateB = {};

    const valueA = selector(stateA);
    selector(stateB);

    expect(selector(stateA)).toBe(valueA);
  });

  it('passes the state to a single combiner function', () => {
    const selector = createSelectorMemoized((state: { value: number }) => state.value);

    expect(selector({ value: 42 })).toBe(42);
  });
});
