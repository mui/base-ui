import { expect } from 'chai';
import { renderHook } from '@testing-library/react';
import { useInsertionEffect } from './useInsertionEffect';

describe('useInsertionEffect', () => {
  it('should call React.useInsertionEffect when available', () => {
    let effectCalled = false;

    renderHook(() => {
      useInsertionEffect(() => {
        effectCalled = true;
      }, []);
    });

    expect(effectCalled).to.equal(true);
  });

  it('should pass dependencies to the effect', () => {
    let callCount = 0;

    const { rerender } = renderHook(({ dep }) => {
      useInsertionEffect(() => {
        callCount += 1;
      }, [dep]);
    }, { initialProps: { dep: 1 } });

    expect(callCount).to.equal(1);

    rerender({ dep: 1 });
    expect(callCount).to.equal(1);

    rerender({ dep: 2 });
    expect(callCount).to.equal(2);
  });
});
