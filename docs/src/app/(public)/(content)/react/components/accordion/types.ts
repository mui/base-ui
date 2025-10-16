import { Accordion } from '@base-ui-components/react/accordion';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Accordion, {
  watchSourceDirectly: true,
});

export const TypesAccordionHeader = types.Header;
export const TypesAccordionItem = types.Item;
export const TypesAccordionPanel = types.Panel;
export const TypesAccordionRoot = types.Root;
export const TypesAccordionTrigger = types.Trigger;
