import { Autocomplete } from '@base-ui-components/react/autocomplete';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Autocomplete);

export const TypesAutocompleteRoot = types.Root;
export const TypesAutocompleteValue = types.Value;
