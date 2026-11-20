import { Tree } from '@base-ui/react/tree';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, Tree);

export const TypesTree = types;
export const TypesTreeAdditional = AdditionalTypes;
