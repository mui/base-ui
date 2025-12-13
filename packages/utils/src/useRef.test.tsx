import { expect } from 'chai';
import { renderHook } from '@testing-library/react';
import { useRef } from './useRef';

describe('useRef', () => {
  it('should create a ref with initial value', () => {
    const { result } = renderHook(() => useRef(42));
    
    expect(result.current.current).to.equal(42);
  });

  it('should maintain ref value across renders', () => {
    const { result, rerender } = renderHook(() => useRef(42));
    
    result.current.current = 100;
    rerender();
    
    expect(result.current.current).to.equal(100);
  });

  it('should work with null initial value', () => {
    const { result } = renderHook(() => useRef<HTMLDivElement>(null));
    
    expect(result.current.current).to.equal(null);
  });

  it('should work with undefined initial value', () => {
    const { result } = renderHook(() => useRef<number>());
    
    expect(result.current.current).to.equal(undefined);
  });
});
