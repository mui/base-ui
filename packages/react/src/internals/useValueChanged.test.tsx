import { expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useValueChanged } from './useValueChanged';

describe('useValueChanged', () => {
  it('retains -0 as the previous value without treating it as a change from 0', () => {
    const onChange = vi.fn();

    function Test({ value }: { value: number }) {
      useValueChanged(value, onChange);
      return null;
    }

    const { rerender } = render(<Test value={0} />);

    rerender(<Test value={-0} />);
    expect(onChange).not.toHaveBeenCalled();

    rerender(<Test value={1} />);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(Object.is(onChange.mock.calls[0][0], -0)).toBe(true);
  });
});
