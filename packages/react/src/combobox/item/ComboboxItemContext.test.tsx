import { expect, vi } from 'vitest';
import { createRenderer } from '#test-utils';
import { useComboboxItemContext } from './ComboboxItemContext';

describe('ComboboxItemContext', () => {
  const { render } = createRenderer();

  it('throws a descriptive error when used outside <Combobox.Item>', async () => {
    function Consumer() {
      useComboboxItemContext();
      return null;
    }

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Consumer />)).rejects.toThrow(
        'Base UI: ComboboxItemContext is missing. ComboboxItem parts must be placed within <Combobox.Item>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
