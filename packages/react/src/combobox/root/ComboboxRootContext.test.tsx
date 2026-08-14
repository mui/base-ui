import { expect, vi } from 'vitest';
import { createRenderer } from '#test-utils';
import {
  useComboboxDerivedItemsContext,
  useComboboxFloatingContext,
  useComboboxRootContext,
} from './ComboboxRootContext';

describe('ComboboxRootContext', () => {
  const { render } = createRenderer();

  const cases = [
    {
      useContext: useComboboxRootContext,
      message:
        'Base UI: ComboboxRootContext is missing. Combobox parts must be placed within <Combobox.Root>.',
    },
    {
      useContext: useComboboxFloatingContext,
      message:
        'Base UI: ComboboxFloatingContext is missing. Combobox parts must be placed within <Combobox.Root>.',
    },
    {
      useContext: useComboboxDerivedItemsContext,
      message:
        'Base UI: ComboboxItemsContext is missing. Combobox parts must be placed within <Combobox.Root>.',
    },
  ];

  cases.forEach(({ useContext, message }) => {
    it(`throws when its provider is missing: ${message}`, async () => {
      function Consumer() {
        useContext();
        return null;
      }

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await expect(render(<Consumer />)).rejects.toThrow(message);
      } finally {
        errorSpy.mockRestore();
      }
    });
  });
});
