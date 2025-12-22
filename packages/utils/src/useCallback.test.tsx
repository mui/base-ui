import { expect } from 'chai';
import { renderHook } from '@testing-library/react';
import { useCallback } from './useCallback';

describe('useCallback', () => {
  it('should return a memoized callback', () => {
    const { result, rerender } = renderHook(() => useCallback(() => 42, []));
    
    const firstCallback = result.current;
    rerender();
    const secondCallback = result.current;
    
    expect(firstCallback).to.equal(secondCallback);
  });

  it('should update callback when dependencies change', () => {
    const { result, rerender } = renderHook(
      ({ dep }) => useCallback(() => dep, [dep]),
      { initialProps: { dep: 1 } }
    );
    
    const firstCallback = result.current;
    expect(firstCallback()).to.equal(1);
    
    rerender({ dep: 2 });
    const secondCallback = result.current;
    
    expect(firstCallback).to.not.equal(secondCallback);
    expect(secondCallback()).to.equal(2);
  });

  it('should preserve callback when dependencies do not change', () => {
    const { result, rerender } = renderHook(
      ({ dep }) => useCallback(() => dep, [dep]),
      { initialProps: { dep: 1 } }
    );
    
    const firstCallback = result.current;
    
    rerender({ dep: 1 });
    const secondCallback = result.current;
    
    expect(firstCallback).to.equal(secondCallback);
  });
});
