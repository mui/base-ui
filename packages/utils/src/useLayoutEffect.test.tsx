import { expect } from 'chai';
import * as React from 'react';
import { renderHook } from '@testing-library/react';
import { useLayoutEffect } from './useLayoutEffect';

describe('useLayoutEffect', () => {
  it('should call React.useLayoutEffect', () => {
    let effectCalled = false;

    renderHook(() => {
      useLayoutEffect(() => {
        effectCalled = true;
      }, []);
    });

    expect(effectCalled).to.equal(true);
  });

  it('should pass dependencies to React.useLayoutEffect', () => {
    let callCount = 0;

    const { rerender } = renderHook(({ dep }) => {
      useLayoutEffect(() => {
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
