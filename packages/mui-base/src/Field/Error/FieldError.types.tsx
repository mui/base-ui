import type { BaseUIComponentProps } from '../../utils/types';
import type { FieldRootOwnerState } from '../Root/FieldRoot.types';

export type FieldErrorOwnerState = FieldRootOwnerState;

export interface FieldErrorProps extends BaseUIComponentProps<'span', FieldErrorOwnerState> {
  show?: keyof ValidityState;
}
