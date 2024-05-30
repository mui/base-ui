import type { TooltipArrowOwnerState } from './TooltipArrow.types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

export const tooltipArrowStyleHookMapping: CustomStyleHookMapping<TooltipArrowOwnerState> = {
  open(value) {
    return {
      'data-state': value ? 'open' : 'closed',
    };
  },
};
