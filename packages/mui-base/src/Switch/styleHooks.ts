import type { SwitchRoot } from './Root/SwitchRoot';
import type { CustomStyleHookMapping } from '../utils/getStyleHookProps';

export const styleHookMapping: CustomStyleHookMapping<SwitchRoot.OwnerState> = {
  checked: (value) => ({ 'data-switch': value ? 'checked' : 'unchecked' }),
};
