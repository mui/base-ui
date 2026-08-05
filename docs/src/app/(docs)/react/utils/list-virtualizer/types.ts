import * as ListVirtualizerNamespace from '@base-ui/react/list-virtualizer';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, ListVirtualizerNamespace);

export const TypesListVirtualizer = types.ListVirtualizer;
export const TypesListVirtualizerAdditionalTypes = AdditionalTypes;
