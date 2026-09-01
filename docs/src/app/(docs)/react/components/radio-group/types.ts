import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { createMultipleTypes } from 'docs/src/utils/createTypes';

const { types } = createMultipleTypes(import.meta.url, { RadioGroup, Radio });

export const TypesRadioGroup = types;
