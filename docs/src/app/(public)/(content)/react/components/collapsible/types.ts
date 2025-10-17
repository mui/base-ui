import { Collapsible } from '@base-ui-components/react/collapsible';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Collapsible);

export const TypesCollapsibleRoot = types.Root;
export const TypesCollapsibleTrigger = types.Trigger;
export const TypesCollapsiblePanel = types.Panel;
