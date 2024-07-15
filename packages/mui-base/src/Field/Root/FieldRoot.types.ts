import type * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';

export interface FieldRootContextValue {
  controlId: string | undefined;
  setControlId: React.Dispatch<React.SetStateAction<string | undefined>>;
  descriptionId: string | undefined;
  setDescriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export type FieldRootOwnerState = {};

export interface FieldRootProps extends BaseUIComponentProps<'div', FieldRootOwnerState> {}
