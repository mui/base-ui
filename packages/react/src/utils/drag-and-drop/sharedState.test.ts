import { describe, it, expect } from 'vitest';
import { getSharedSlot } from './sharedState';

describe('getSharedSlot', () => {
  it('returns the first slot for a name, never re-running the factory', () => {
    const first = getSharedSlot<{ value: number }>('sharedState.test.identity', () => ({
      value: 1,
    }));
    const second = getSharedSlot<{ value: number }>('sharedState.test.identity', () => ({
      value: 2,
    }));
    expect(second).toBe(first);
    expect(second.value).toBe(1);
  });

  it('exposes mutations through every handle', () => {
    const a = getSharedSlot<{ value: number }>('sharedState.test.mutation', () => ({ value: 0 }));
    const b = getSharedSlot<{ value: number }>('sharedState.test.mutation', () => ({ value: 0 }));
    a.value = 42;
    expect(b.value).toBe(42);
  });
});
