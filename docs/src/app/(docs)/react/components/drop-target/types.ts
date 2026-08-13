import { DropTarget } from '@base-ui/react/drop-target';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, DropTarget);

export const TypesDropTarget = types;
export const TypesDropTargetAdditional = AdditionalTypes;
