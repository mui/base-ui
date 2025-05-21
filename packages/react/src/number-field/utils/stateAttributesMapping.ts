import { StateAttributesMapping } from '../../utils/mapStateAttributes';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';

export const stateAttributesMapping: StateAttributesMapping<NumberFieldRoot.State> = {
  inputValue: () => null,
  value: () => null,
};
