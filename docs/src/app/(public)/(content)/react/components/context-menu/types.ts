import { ContextMenu } from '@base-ui-components/react/context-menu';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, ContextMenu);

export const TypesContextMenuRoot = types.Root;
export const TypesContextMenuTrigger = types.Trigger;
