import { expect, vi, describe } from 'vitest';
import { render } from '@testing-library/react';
import * as React from 'react';
import { useValueChanged } from './useValueChanged';

describe('useValueChanged', () => {
  it.each([false, true])(
    'retains -0 as the previous value without treating it as a change from 0 (strict: %s)',
    (strict) => {
      const onChange = vi.fn();

      function Test({ value }: { value: number }) {
        useValueChanged(value, onChange);
        return null;
      }

      function App({ value }: { value: number }) {
        const test = <Test value={value} />;
        return strict ? <React.StrictMode>{test}</React.StrictMode> : test;
      }

      const { rerender } = render(<App value={0} />);

      rerender(<App value={-0} />);
      expect(onChange).not.toHaveBeenCalled();

      rerender(<App value={1} />);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(Object.is(onChange.mock.calls[0][0], -0)).toBe(true);
    },
  );
});
