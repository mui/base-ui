import type { StateAttributesMapping } from '../../utils/mapStateAttributes';
import type { ProgressRoot } from './ProgressRoot';
import { ProgressRootDataAttributes } from './ProgressRootDataAttributes';

export const progressMapping: StateAttributesMapping<ProgressRoot.State> = {
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
