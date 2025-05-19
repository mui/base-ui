import type { StateAttributesMapping } from '../../utils/mapStateAttributes';
import { collapsibleOpenStateMapping as baseMapping } from '../../utils/collapsibleOpenStateMapping';
import type { AccordionItem } from './AccordionItem';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { AccordionItemDataAttributes } from './AccordionItemDataAttributes';

export const accordionMapping: StateAttributesMapping<AccordionItem.State> = {
  ...baseMapping,
  index: (value) => {
    return Number.isInteger(value) ? { [AccordionItemDataAttributes.index]: String(value) } : null;
  },
  ...transitionStatusMapping,
  value: () => null,
};
