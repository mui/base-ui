import type * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';

export interface ValidityData {
  validityState: ValidityState;
  validityMessage: string;
  value: unknown;
}

export interface FieldRootContextValue {
  controlId: string | undefined;
  setControlId: React.Dispatch<React.SetStateAction<string | undefined>>;
  messageIds: string[];
  setMessageIds: React.Dispatch<React.SetStateAction<string[]>>;
  validityData: ValidityData;
  setValidityData: React.Dispatch<React.SetStateAction<ValidityData>>;
  controlElement: Element | undefined;
  setControlElement: React.Dispatch<React.SetStateAction<Element | undefined>>;
}

export type FieldRootOwnerState = {};

export interface FieldRootProps extends BaseUIComponentProps<'div', FieldRootOwnerState> {}
