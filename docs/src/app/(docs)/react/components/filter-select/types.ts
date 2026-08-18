import { FilterSelect } from '@base-ui/react/filter-select';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, FilterSelect);

export const TypesFilterSelect = types;
export const TypesFilterSelectAdditional = AdditionalTypes;
