import * as UseDragEngine from '@base-ui/react/use-drag-engine';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, UseDragEngine);

export const TypesUseDragEngine = types;
export const TypesUseDragEngineAdditional = AdditionalTypes;
