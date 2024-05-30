import type { TooltipTriggerOwnerState } from './TooltipTrigger.types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

export const tooltipTriggerStyleHookMapping: CustomStyleHookMapping<TooltipTriggerOwnerState> = {
  open(value) {
    return {
      'data-state': value ? 'open' : 'closed',
    };
  },
};
