import { DragAutoScroll } from '@base-ui/react/drag-auto-scroll';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, DragAutoScroll);

export const TypesDragAutoScroll = types;
export const TypesDragAutoScrollAdditional = AdditionalTypes;
