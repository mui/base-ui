import type * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import type { UseCheckboxGroupParentReturnValue } from '../Parent/useCheckboxGroupParent.types';

export type CheckboxGroupRootOwnerState = {};

export interface CheckboxGroupRootContextValue {
  groupLabelId: string | undefined;
  setGroupLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  value: string[];
  setValue: (value: string[]) => void;
  allValues: string[] | undefined;
  parent: UseCheckboxGroupParentReturnValue;
}

export interface CheckboxGroupRootProps
  extends BaseUIComponentProps<'div', CheckboxGroupRootOwnerState> {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  allValues?: string[];
}
