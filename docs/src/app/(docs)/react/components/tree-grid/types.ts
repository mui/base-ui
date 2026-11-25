import { TreeGrid } from '@base-ui/react/tree-grid';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, TreeGrid);

export const TypesTreeGrid = types;
export const TypesTreeGridAdditional = AdditionalTypes;
