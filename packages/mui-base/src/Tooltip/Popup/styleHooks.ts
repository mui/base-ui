import type { TooltipPopupOwnerState } from './TooltipPopup.types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

export const tooltipPopupStyleHookMapping: CustomStyleHookMapping<TooltipPopupOwnerState> = {
  entering(value) {
    return value ? { 'data-entering': '' } : null;
  },
  exiting(value) {
    return value ? { 'data-exiting': '' } : null;
  },
  open(value) {
    return {
      'data-state': value ? 'open' : 'closed',
    };
  },
};
