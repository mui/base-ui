import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { ProgressRoot } from './ProgressRoot';
import { ProgressRootDataAttributes } from './ProgressRootDataAttributes';

export const progressStyleHookMapping: CustomStyleHookMapping<ProgressRoot.State> = {
  status(value): Record<string, string> | null {
    if (value === 'progressing') {
      return { [ProgressRootDataAttributes.progressing]: '' };
    }
    if (value === 'complete') {
      return { [ProgressRootDataAttributes.complete]: '' };
    }
    if (value === 'indeterminate') {
      return { [ProgressRootDataAttributes.indeterminate]: '' };
    }
    return null;
  },
};
