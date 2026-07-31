import { expect, vi } from 'vitest';
import { createRenderer } from '#test-utils';
import { useComboboxGroupContext } from './ComboboxGroupContext';

describe('ComboboxGroupContext', () => {
  const { render } = createRenderer();

  it('throws a descriptive error when used outside <Combobox.Group>', async () => {
    function Consumer() {
      useComboboxGroupContext();
      return null;
    }

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Consumer />)).rejects.toThrow(
        'Base UI: ComboboxGroupContext is missing. ComboboxGroup parts must be placed within <Combobox.Group>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
