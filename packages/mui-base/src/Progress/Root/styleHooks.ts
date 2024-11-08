import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps.js';
import type { ProgressRoot } from './ProgressRoot.js';

export const progressStyleHookMapping: CustomStyleHookMapping<ProgressRoot.OwnerState> = {
  direction: () => null,
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
