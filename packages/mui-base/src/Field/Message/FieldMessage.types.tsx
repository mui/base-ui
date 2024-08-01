import type { BaseUIComponentProps } from '../../utils/types';

export type FieldMessageOwnerState = {
  disabled: boolean;
  valid: boolean | null;
};

export interface FieldMessageProps extends BaseUIComponentProps<'span', FieldMessageOwnerState> {
  show?: keyof ValidityState;
}
