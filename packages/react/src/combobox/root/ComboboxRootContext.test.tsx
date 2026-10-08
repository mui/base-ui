import { expect, vi, describe, it } from 'vitest';
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
      name: 'useComboboxRootContext',
      useContext: useComboboxRootContext,
      message:
        'Base UI: ComboboxRootContext is missing. Combobox parts must be placed within <Combobox.Root>.',
    },
    {
      name: 'useComboboxFloatingContext',
      useContext: useComboboxFloatingContext,
      message:
        'Base UI: ComboboxFloatingContext is missing. Combobox parts must be placed within <Combobox.Root>.',
    },
    {
      name: 'useComboboxDerivedItemsContext',
      useContext: useComboboxDerivedItemsContext,
      message:
        'Base UI: ComboboxItemsContext is missing. Combobox parts must be placed within <Combobox.Root>.',
    },
  ];

  it.each(cases)('$name throws when its provider is missing', async ({ useContext, message }) => {
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
