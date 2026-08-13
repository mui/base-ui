import * as UseDragMonitor from '@base-ui/react/use-drag-monitor';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, UseDragMonitor);

export const TypesUseDragMonitor = types;
export const TypesUseDragMonitorAdditional = AdditionalTypes;
