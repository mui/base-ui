import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { CollapsibleRootOwnerState } from './CollapsibleRoot.types';

export const collapsibleStyleHookMapping: CustomStyleHookMapping<CollapsibleRootOwnerState> = {
  open: (value) => {
    return value ? { 'data-state': 'open' } : { 'data-state': 'closed' };
  },
};
