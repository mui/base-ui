import { BaseUIComponentProps } from '@base_ui/react/utils/types';

export type FieldControlElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export type FieldControlOwnerState = {};

export interface FieldControlProps extends BaseUIComponentProps<'input', FieldControlOwnerState> {}
