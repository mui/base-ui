import type { BaseUIComponentProps } from '../../utils/types';

export type FieldMessageOwnerState = {
  disabled: boolean;
  valid: boolean | null;
};

export interface FieldMessageProps extends BaseUIComponentProps<'p', FieldMessageOwnerState> {
  show?: keyof ValidityState;
}
