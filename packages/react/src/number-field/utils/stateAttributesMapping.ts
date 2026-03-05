import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import { fieldValidityMapping } from '../../field/utils/constants';

export const stateAttributesMapping: StateAttributesMapping<NumberFieldRoot.State> = {
  inputValue: () => null,
  value: () => null,
  ...fieldValidityMapping,
};
