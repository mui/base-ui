import * as UseDragDropManager from '@base-ui/react/use-drag-drop-manager';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, UseDragDropManager);

export const TypesUseDragDropManager = types;
export const TypesUseDragDropManagerAdditional = AdditionalTypes;
