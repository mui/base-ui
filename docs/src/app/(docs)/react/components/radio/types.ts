import { Radio } from '@base-ui-components/react/radio';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const types = createMultipleTypes(import.meta.url, Radio);

export const TypesRadioRoot = types.Root;
export const TypesRadioIndicator = types.Indicator;
