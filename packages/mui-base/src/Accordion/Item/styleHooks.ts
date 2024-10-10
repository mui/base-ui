import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { AccordionItem } from './AccordionItem';

export const accordionStyleHookMapping: CustomStyleHookMapping<AccordionItem.OwnerState> = {
  disabled: (value) => {
    if (value) {
      return { 'data-disabled': '' };
    }
    return null;
  },
  index: (value) => {
    return Number.isInteger(value) ? { 'data-index': String(value) } : null;
  },
  open: (value) => {
    return value ? { 'data-accordion': 'open' } : { 'data-accordion': 'closed' };
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
  value: () => null,
};
