import type { BaseUIComponentProps } from '../../utils/types';
import type { FieldRootOwnerState } from '../Root/FieldRoot.types';

export type FieldControlElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export type FieldControlOwnerState = FieldRootOwnerState;

export interface FieldControlProps extends BaseUIComponentProps<'input', FieldControlOwnerState> {}
