import * as VirtualizerNamespace from '@base-ui/react/virtualizer';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, VirtualizerNamespace);

export const TypesVirtualizer = types.Virtualizer;
export const TypesVirtualizerAdditionalTypes = AdditionalTypes;
