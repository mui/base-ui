import type { BaseUIComponentProps } from '../../utils/types';
import type { FieldRootOwnerState } from '../Root/FieldRoot.types';

export type FieldErrorOwnerState = FieldRootOwnerState;

export interface FieldErrorProps extends BaseUIComponentProps<'div', FieldErrorOwnerState> {
  /**
   * Determines whether the error message should be shown when it matches a given property of the
   * field's `ValidityState`.
   */
  show?: keyof ValidityState;
  /**
   * Determines whether the error message should be shown regardless of the field's client validity.
   */
  forceShow?: boolean;
}
