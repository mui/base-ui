import { Radio } from '@base-ui/react/radio';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types, AdditionalTypes } = createMultipleTypes(import.meta.url, Radio, {
  excludeFromIndex: true,
});

export const TypesRadio = types;
export const TypesRadioAdditional = AdditionalTypes;
