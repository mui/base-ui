import { Draggable } from '@base-ui/react/draggable';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, Draggable);

export const TypesDraggable = types;
export const TypesDraggableAdditional = AdditionalTypes;
