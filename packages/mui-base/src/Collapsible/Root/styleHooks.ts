import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps.js';
import { collapsibleOpenStateMapping as baseMapping } from '../../utils/collapsibleOpenStateMapping.js';
import type { CollapsibleRoot } from './CollapsibleRoot.js';

export const collapsibleStyleHookMapping: CustomStyleHookMapping<CollapsibleRoot.OwnerState> = {
  ...baseMapping,
  transitionStatus: (value) => {
    if (value === 'entering') {
      return { 'data-entering': '' } as Record<string, string>;
    }
    if (value === 'exiting') {
      return { 'data-exiting': '' };
    }
    return null;
  },
};
