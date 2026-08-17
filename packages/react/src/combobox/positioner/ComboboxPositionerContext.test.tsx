import { expect, vi } from 'vitest';
import { createRenderer } from '#test-utils';
import { useComboboxPositionerContext } from './ComboboxPositionerContext';

describe('ComboboxPositionerContext', () => {
  const { render } = createRenderer();

  it('throws a descriptive error when a required consumer is outside the positioner', async () => {
    function Consumer() {
      useComboboxPositionerContext();
      return null;
    }

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Consumer />)).rejects.toThrow(
        'Base UI: <Combobox.Popup> and <Combobox.Arrow> must be used within the <Combobox.Positioner> component',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});
