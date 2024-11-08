import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps.js';
import { collapsibleOpenStateMapping as baseMapping } from '../../utils/collapsibleOpenStateMapping.js';
import type { AccordionItem } from './AccordionItem.js';

export const accordionStyleHookMapping: CustomStyleHookMapping<AccordionItem.OwnerState> = {
  ...baseMapping,
  index: (value) => {
    return Number.isInteger(value) ? { 'data-index': String(value) } : null;
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
