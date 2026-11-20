import { ActionTree } from '@base-ui/react/action-tree';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, ActionTree);

export const TypesActionTree = types;
export const TypesActionTreeAdditional = AdditionalTypes;
