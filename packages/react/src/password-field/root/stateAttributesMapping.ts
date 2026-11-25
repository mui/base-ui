import { fieldValidityMapping } from '../../internals/field-constants/constants';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { PasswordFieldRootState } from './PasswordFieldRoot';

// `visible` reaches `className` and `render` callbacks but isn't a data attribute here: the toggle
// and the indicator carry the visibility styling hooks.
export const passwordFieldStateAttributesMapping: StateAttributesMapping<PasswordFieldRootState> = {
  ...fieldValidityMapping,
  visible: () => null,
};
