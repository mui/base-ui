import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';

export const styleHookMapping: CustomStyleHookMapping<NumberFieldRoot.State> = {
  inputValue: () => null,
  value: () => null,
};
