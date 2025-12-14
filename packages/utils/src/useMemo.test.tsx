import { expect } from 'chai';
import { renderHook } from '@testing-library/react';
import { useMemo } from './useMemo';

describe('useMemo', () => {
  it('should return memoized value', () => {
    const { result, rerender } = renderHook(() => useMemo(() => 42, []));

    expect(result.current).to.equal(42);

    rerender();
    expect(result.current).to.equal(42);
  });

  it('should recompute when dependencies change', () => {
    let computeCount = 0;

    const { result, rerender } = renderHook(
      ({ dep }) =>
        useMemo(() => {
          computeCount += 1;
          return dep * 2;
        }, [dep]),
      { initialProps: { dep: 1 } },
    );

    expect(result.current).to.equal(2);
    expect(computeCount).to.equal(1);

    rerender({ dep: 1 });
    expect(result.current).to.equal(2);
    expect(computeCount).to.equal(1);

    rerender({ dep: 2 });
    expect(result.current).to.equal(4);
    expect(computeCount).to.equal(2);
  });

  it('should not recompute when dependencies do not change', () => {
    let computeCount = 0;

    const { result, rerender } = renderHook(
      ({ dep }) =>
        useMemo(() => {
          computeCount += 1;
          return dep * 2;
        }, [dep]),
      { initialProps: { dep: 1 } },
    );

    expect(computeCount).to.equal(1);

    rerender({ dep: 1 });
    expect(computeCount).to.equal(1);
  });

  it('should work without dependencies', () => {
    let computeCount = 0;

    const { result, rerender } = renderHook(() =>
      useMemo(() => {
        computeCount += 1;
        return 42;
      }),
    );

    expect(result.current).to.equal(42);
    expect(computeCount).to.equal(1);

    // Without deps, should recompute on every render
    rerender();
    expect(computeCount).to.equal(2);
  });
});
