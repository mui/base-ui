import type * as React from 'react';
import type { GenericHTMLProps } from '../../utils/types';
import type { UseCheckboxGroupParentReturnValue } from '../Parent/useCheckboxGroupParent.types';

export interface UseCheckboxGroupRootParameters {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  allValues?: string[];
}

export interface UseCheckboxGroupRootReturnValue {
  getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  value: string[];
  setValue: (value: string[]) => void;
  parent: UseCheckboxGroupParentReturnValue;
}
