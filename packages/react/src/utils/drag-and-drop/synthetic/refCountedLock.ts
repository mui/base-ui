import { getSharedSlot } from '../sharedState';

export interface RefCountedLock<TArgs extends unknown[]> {
  lock: (...args: TArgs) => void;
  /** Idempotent at depth 0, so it pairs with a conditional `lock`. */
  unlock: () => void;
  resetForTests: () => void;
}

/**
 * A document-wide lock shared by every holder. `acquire` runs for the first
 * holder and `release` for the last, so re-entrant locks (the pointer sensor
 * taking the root lock and the cursor lock for one gesture) share one activation
 * instead of stomping each other's saved state.
 *
 * The count lives in a shared slot like every other engine singleton: two copies
 * of the package on one page must not each believe they hold the document.
 */
export function createRefCountedLock<TArgs extends unknown[]>(parameters: {
  slot: string;
  acquire: (...args: TArgs) => void;
  release: () => void;
}): RefCountedLock<TArgs> {
  const { slot, acquire, release } = parameters;
  const state = getSharedSlot<{ count: number }>(slot, () => ({ count: 0 }));

  return {
    lock: (...args: TArgs) => {
      state.count += 1;
      if (state.count === 1) {
        acquire(...args);
      }
    },
    unlock: () => {
      if (state.count === 0) {
        return;
      }
      state.count -= 1;
      if (state.count === 0) {
        release();
      }
    },
    resetForTests: () => {
      release();
      state.count = 0;
    },
  };
}
