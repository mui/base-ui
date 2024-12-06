import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

export const customStyleHookMapping = {
  checked(value): Record<string, string> {
    if (value) {
      return { 'data-checked': '' };
    }
    return { 'data-unchecked': '' };
  },
} satisfies CustomStyleHookMapping<{ checked: boolean }>;
