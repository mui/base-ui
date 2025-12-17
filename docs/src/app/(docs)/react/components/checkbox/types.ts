import { Checkbox } from '@base-ui-components/react/checkbox';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Checkbox);

export const TypesCheckboxRoot = types.Root;
export const TypesCheckboxIndicator = types.Indicator;
