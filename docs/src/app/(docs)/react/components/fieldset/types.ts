import { Fieldset } from '@base-ui/react/fieldset';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types } = createMultipleTypes(import.meta.url, Fieldset);

export const TypesFieldsetRoot = types.Root;
export const TypesFieldsetLegend = types.Legend;
