import { Listbox } from '@base-ui/react/listbox';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, Listbox);

export const TypesListbox = types;
export const TypesListboxAdditional = AdditionalTypes;
