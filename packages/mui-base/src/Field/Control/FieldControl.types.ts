import type { BaseUIComponentProps } from '../../utils/types';
import type { FieldRootOwnerState } from '../Root/FieldRoot.types';

export type FieldControlElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export type FieldControlOwnerState = FieldRootOwnerState;

export interface FieldControlProps extends BaseUIComponentProps<'input', FieldControlOwnerState> {
  /**
   * Callback fired when the `value` changes. Use when controlled.
   */
  onValueChange?: (value: string | number | readonly string[] | undefined, event: Event) => void;
}
