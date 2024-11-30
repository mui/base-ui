import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { ProgressRoot } from './ProgressRoot';

export const progressStyleHookMapping: CustomStyleHookMapping<ProgressRoot.State> = {
  max: () => null,
  min: () => null,
  status(value): Record<string, string> | null {
    if (value === 'progressing') {
      return { 'data-progressing': '' };
    }
    if (value === 'complete') {
      return { 'data-complete': '' };
    }
    if (value === 'indeterminate') {
      return { 'data-indeterminate': '' };
    }
    return null;
  },
};
