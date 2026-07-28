import { expect } from 'vitest';
import { closestSnapPointIndex, getSnapPointSwipeMovement } from './useDrawerSnapPoints';

describe('getSnapPointSwipeMovement', () => {
  it('returns the raw movement when the drag does not overshoot the open edge', () => {
    expect(getSnapPointSwipeMovement(100, -50)).toBe(-50);
    expect(getSnapPointSwipeMovement(0, 20)).toBe(20);
  });

  it('returns the raw movement at the open edge (nextOffset === 0)', () => {
    expect(getSnapPointSwipeMovement(100, -100)).toBe(-100);
  });

  it('damps the movement with a square root once the drag overshoots the open edge', () => {
    expect(getSnapPointSwipeMovement(0, -150)).toBeCloseTo(-Math.sqrt(150));
    expect(getSnapPointSwipeMovement(100, -250)).toBeCloseTo(-Math.sqrt(150) - 100);
  });
});

describe('closestSnapPointIndex', () => {
  it('returns the closest value and keeps the first value on ties', () => {
    expect(closestSnapPointIndex([100, 200, 300], 240)).toBe(1);
    expect(closestSnapPointIndex([100, 200], 150)).toBe(0);
  });

  it('returns -1 when there are no values', () => {
    expect(closestSnapPointIndex([], 100)).toBe(-1);
  });
});
