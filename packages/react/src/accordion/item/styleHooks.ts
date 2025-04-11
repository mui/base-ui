import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { collapsibleOpenStateMapping as baseMapping } from '../../utils/collapsibleOpenStateMapping';
import type { AccordionItem } from './AccordionItem';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { AccordionItemDataAttributes } from './AccordionItemDataAttributes';

export const accordionStyleHookMapping: CustomStyleHookMapping<AccordionItem.State> = {
  ...baseMapping,
  index: (value) => {
    return Number.isInteger(value) ? { [AccordionItemDataAttributes.index]: String(value) } : null;
  },
  ...transitionStatusMapping,
  value: () => null,
};
