import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import type { NumberFieldRootState } from '../root/NumberFieldRoot';
import { fieldValidityMapping } from '../../field/utils/constants';

export const stateAttributesMapping: StateAttributesMapping<NumberFieldRootState> = {
  inputValue: () => null,
  value: () => null,
  ...fieldValidityMapping,
};
