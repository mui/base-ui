import type { GenericHTMLProps } from '../../utils/types';
import type { UseCheckboxGroupParentReturnValue } from '../Parent/useCheckboxGroupParent.types';

export interface UseCheckboxGroupRootParameters {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  allValues?: string[];
  labelId: string | undefined;
}

export interface UseCheckboxGroupRootReturnValue {
  getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  value: string[];
  setValue: (value: string[]) => void;
  parent: UseCheckboxGroupParentReturnValue;
}
