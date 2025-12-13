import { expect } from 'chai';
import * as React from 'react';
import { renderHook } from '@testing-library/react';
import { useEffect } from './useEffect';

describe('useEffect', () => {
  it('should call React.useEffect', () => {
    let effectCalled = false;

    renderHook(() => {
      useEffect(() => {
        effectCalled = true;
      }, []);
    });

    expect(effectCalled).to.equal(true);
  });

  it('should pass dependencies to React.useEffect', () => {
    let callCount = 0;

    const { rerender } = renderHook(({ dep }) => {
      useEffect(() => {
        callCount++;
      }, [dep]);
    }, { initialProps: { dep: 1 } });

    expect(callCount).to.equal(1);

    rerender({ dep: 1 });
    expect(callCount).to.equal(1);

    rerender({ dep: 2 });
    expect(callCount).to.equal(2);
  });
});
