import type { BaseUIComponentProps } from '../../utils/types';

export type FieldErrorOwnerState = {
  disabled: boolean;
  valid: boolean | null;
};

export interface FieldErrorProps extends BaseUIComponentProps<'span', FieldErrorOwnerState> {
  show?: keyof ValidityState;
  forceShow?: boolean;
}
