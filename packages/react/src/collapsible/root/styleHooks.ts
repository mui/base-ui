import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { collapsibleOpenStateMapping as baseMapping } from '../../utils/collapsibleOpenStateMapping';
import type { CollapsibleRoot } from './CollapsibleRoot';

export const collapsibleStyleHookMapping: CustomStyleHookMapping<CollapsibleRoot.State> = {
  ...baseMapping,
  transitionStatus: (value) => {
    if (value === 'entering') {
      return { 'data-starting-style': '' } as Record<string, string>;
    }
    if (value === 'exiting') {
      return { 'data-ending-style': '' };
    }
    return null;
  },
};
