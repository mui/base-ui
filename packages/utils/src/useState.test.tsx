import { expect } from 'chai';
import { renderHook, act } from '@testing-library/react';
import { useState } from './useState';

describe('useState', () => {
  it('should return initial state and setter', () => {
    const { result } = renderHook(() => useState(42));
    
    expect(result.current[0]).to.equal(42);
    expect(typeof result.current[1]).to.equal('function');
  });

  it('should update state when setter is called', () => {
    const { result } = renderHook(() => useState(42));
    
    act(() => {
      result.current[1](100);
    });
    
    expect(result.current[0]).to.equal(100);
  });

  it('should work with function initializer', () => {
    const { result } = renderHook(() => useState(() => 42));
    
    expect(result.current[0]).to.equal(42);
  });

  it('should work with updater function', () => {
    const { result } = renderHook(() => useState(42));
    
    act(() => {
      result.current[1](prev => prev + 10);
    });
    
    expect(result.current[0]).to.equal(52);
  });

  it('should work with undefined initial state', () => {
    const { result } = renderHook(() => useState<number>());
    
    expect(result.current[0]).to.equal(undefined);
  });
});
