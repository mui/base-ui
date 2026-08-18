import { FilterMenu } from '@base-ui/react/filter-menu';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, FilterMenu);

export const TypesFilterMenu = types;
export const TypesFilterMenuAdditional = AdditionalTypes;
