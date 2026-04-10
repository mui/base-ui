import { fieldValidityMapping } from '../../field/utils/constants';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import type { OTPFieldRootState } from '../root/OTPFieldRoot';
import type { OTPFieldInputState } from '../input/OTPFieldInput';

export const rootStateAttributesMapping: StateAttributesMapping<OTPFieldRootState> = {
  value: () => null,
  length: () => null,
  ...fieldValidityMapping,
};

export const inputStateAttributesMapping: StateAttributesMapping<OTPFieldInputState> = {
  value: () => null,
  index: () => null,
  ...fieldValidityMapping,
};
