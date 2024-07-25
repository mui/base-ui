import type { BaseUIComponentProps } from '../../utils/types';

export type FieldMessageOwnerState = {
  disabled: boolean;
};

export interface FieldMessageProps extends BaseUIComponentProps<'p', FieldMessageOwnerState> {
  show?: keyof ValidityState | ((value: unknown) => boolean | Promise<boolean>);
}
