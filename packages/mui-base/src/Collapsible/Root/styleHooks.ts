import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { CollapsibleRootOwnerState } from './CollapsibleRoot.types';

export const collapsibleStyleHookMapping: CustomStyleHookMapping<CollapsibleRootOwnerState> = {
  open: (value) => {
    return value ? { 'data-state': 'open' } : { 'data-state': 'closed' };
  },
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
