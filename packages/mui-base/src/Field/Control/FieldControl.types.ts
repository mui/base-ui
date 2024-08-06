import type { BaseUIComponentProps } from '../../utils/types';

export type FieldControlElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export type FieldControlOwnerState = {
  disabled: boolean;
  touched: boolean;
  dirty: boolean;
  valid: boolean;
};

export interface FieldControlProps extends BaseUIComponentProps<'input', FieldControlOwnerState> {}
