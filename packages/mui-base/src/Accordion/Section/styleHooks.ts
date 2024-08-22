import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { AccordionSection } from './AccordionSection';

export const accordionStyleHookMapping: CustomStyleHookMapping<AccordionSection.OwnerState> = {
  index: (value) => {
    return Number.isInteger(value) ? { 'data-index': String(value) } : null;
  },
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
  value: () => null,
};
