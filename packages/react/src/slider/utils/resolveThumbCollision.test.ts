import { expect } from 'vitest';
import { resolveThumbCollision } from './resolveThumbCollision';

describe('resolveThumbCollision', () => {
  it('prevents thumbs from passing each other when behavior is "none"', () => {
    const result = resolveThumbCollision(
      'none',
      [20, 40],
      undefined,
      undefined,
      0,
      70,
      0,
      100,
      1,
      0,
    );

    expect(result.value).toEqual([40, 40]);
    expect(result.thumbIndex).toBe(0);
    expect(result.didSwap).toBe(false);
  });

  it('pushes thumbs forward without cling when behavior is "push"', () => {
    const result = resolveThumbCollision(
      'push',
      [20, 40],
      undefined,
      undefined,
      0,
      70,
      0,
      100,
      1,
      0,
    );

    expect(result.value).toEqual([70, 70]);
    expect(result.thumbIndex).toBe(0);
    expect(result.didSwap).toBe(false);
  });

  it('keeps pushed thumbs in place when moving backward in push mode', () => {
    const startValues = [20, 40];

    const pushed = resolveThumbCollision(
      'push',
      startValues,
      startValues,
      startValues,
      0,
      70,
      0,
      100,
      1,
      0,
    );

    const nextValues = pushed.value as number[];
    expect(nextValues).toEqual([70, 70]);

    const movedBack = resolveThumbCollision(
      'push',
      nextValues,
      nextValues,
      startValues,
      0,
      30,
      0,
      100,
      1,
      0,
    );

    expect(movedBack.value).toEqual([30, 70]);
    expect(movedBack.thumbIndex).toBe(0);
    expect(movedBack.didSwap).toBe(false);
  });

  it('swaps thumbs when behavior is "swap"', () => {
    const result = resolveThumbCollision(
      'swap',
      [20, 40],
      undefined,
      undefined,
      0,
      65,
      0,
      100,
      1,
      0,
    );

    expect(result.value).toEqual([40, 65]);
    expect(result.thumbIndex).toBe(1);
    expect(result.didSwap).toBe(true);
  });

  it('maintains swap continuity with minimum steps when provided current and initial values', () => {
    const startValues = [20, 80];

    const first = resolveThumbCollision(
      'swap',
      startValues,
      startValues,
      startValues,
      0,
      85,
      0,
      100,
      1,
      10,
    );

    const firstValues = first.value as number[];
    expect(firstValues).toEqual([70, 85]);
    expect(first.thumbIndex).toBe(1);
    expect(first.didSwap).toBe(true);

    const continued = resolveThumbCollision(
      'swap',
      startValues,
      firstValues,
      startValues,
      first.thumbIndex,
      95,
      0,
      100,
      1,
      10,
    );

    const continuedValues = continued.value as number[];
    expect(continuedValues).toEqual([70, 95]);
    expect(continued.thumbIndex).toBe(1);
    expect(continued.didSwap).toBe(false);
  });

  it('does not swap before reaching neighbour value with minimum steps', () => {
    const result = resolveThumbCollision('swap', [25, 45], [40, 45], [25, 45], 0, 44, 0, 100, 1, 5);

    const resultValues = result.value as number[];
    expect(resultValues).toEqual([40, 45]);
    expect(result.thumbIndex).toBe(0);
    expect(result.didSwap).toBe(false);
  });

  it('swaps once reaching the neighbour value with minimum steps', () => {
    const result = resolveThumbCollision('swap', [25, 45], [40, 45], [25, 45], 0, 45, 0, 100, 1, 5);

    const resultValues = result.value as number[];
    expect(resultValues).toEqual([40, 45]);
    expect(result.thumbIndex).toBe(1);
    expect(result.didSwap).toBe(true);
  });

  it('does not swap backward before reaching neighbour value with minimum steps', () => {
    const result = resolveThumbCollision('swap', [25, 45], [25, 40], [25, 45], 1, 29, 0, 100, 1, 5);

    const resultValues = result.value as number[];
    expect(resultValues).toEqual([25, 30]);
    expect(result.thumbIndex).toBe(1);
    expect(result.didSwap).toBe(false);
  });

  it('swaps backward once reaching the neighbour value with minimum steps', () => {
    const result = resolveThumbCollision('swap', [25, 45], [25, 40], [25, 45], 1, 25, 0, 100, 1, 5);

    const resultValues = result.value as number[];
    expect(resultValues).toEqual([25, 30]);
    expect(result.thumbIndex).toBe(0);
    expect(result.didSwap).toBe(true);
  });

  it('does not move the clamped neighbour when swapping across with minimum steps', () => {
    const startValues = [25, 45];
    const currentValues = [40, 45];

    const result = resolveThumbCollision(
      'swap',
      currentValues,
      currentValues,
      startValues,
      0,
      46,
      0,
      100,
      1,
      5,
    );

    const resultValues = result.value as number[];
    expect(resultValues).toEqual([40, 46]);
    expect(result.thumbIndex).toBe(1);
    expect(result.didSwap).toBe(true);
  });

  it('uses current values when a controlled range grows during a swap interaction', () => {
    const result = resolveThumbCollision(
      'swap',
      [20, 40],
      [20, 40, 60],
      [20, 40],
      1,
      70,
      0,
      100,
      1,
      0,
    );

    expect(result).toEqual({
      value: [20, 60, 70],
      thumbIndex: 2,
      didSwap: true,
    });
  });

  it('returns a scalar when the live values shrink to one item during an interaction', () => {
    const result = resolveThumbCollision('push', [20, 40], [20], [20, 40], 0, 30, 0, 100, 1, 0);

    expect(result).toEqual({
      value: 30,
      thumbIndex: 0,
      didSwap: false,
    });
  });
});
