import { expect, vi } from 'vitest';
import { createRenderer } from '#test-utils';
import { useComboboxPortalContext } from './ComboboxPortalContext';

describe('ComboboxPortalContext', () => {
  const { render } = createRenderer();

  it('throws a descriptive error when used outside <Combobox.Portal>', async () => {
    function Consumer() {
      useComboboxPortalContext();
      return null;
    }

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Consumer />)).rejects.toThrow('Base UI: <Combobox.Portal> is missing.');
    } finally {
      errorSpy.mockRestore();
    }
  });
});
