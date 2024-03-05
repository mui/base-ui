import { PartiallyRequired } from '@mui/types';
import { FieldAction, FieldError } from './fieldAction.types';
import { ActionWithContext } from '../utils/useControllableReducer.types';

export interface FieldState {
  value: unknown;
  dirty: boolean;
  disabled: boolean;
  focused: boolean;
  invalid: boolean;
  touched: boolean;
  error: FieldError;
}

export type FieldActionContext = {
  disabled: boolean;
};

export type FieldReducerAction = ActionWithContext<FieldAction, FieldActionContext>;

type RenderFunction = (
  props: React.ComponentPropsWithRef<'div'>,
  ownerState: any,
) => React.ReactNode;

export interface FormFieldProps {
  id?: string;
  value?: unknown;
  defaultValue?: unknown;
  disabled?: boolean;
  focused?: boolean;
  invalid?: boolean;
  touched?: boolean;
  dirty?: boolean;
  // to consume `error` with a custom shape, Labels and such must use a custom render function
  error?: string | null | Record<string, unknown>;
  className?: string;
  children?: React.ReactNode;
  render?: RenderFunction;
}

export interface FormFieldContextValue {
  id: string;
  labelId: string;
  helpTextId: string;
  value: unknown;
  dirty: boolean;
  disabled: boolean;
  focused: boolean;
  invalid: boolean;
  touched: boolean;
  dispatch: (action: FieldAction) => void;
  error: string | null | Record<string, unknown>;
  hasLabel: boolean;
  registerLabel: (element: Element | null) => void;
  hasHelpText: boolean;
  registerHelpText: (element: Element | null) => void;
}

export type FieldOwnerStateCommonRequiredKeys = 'disabled' | 'invalid' | 'touched' | 'dirty';

export interface FormFieldOwnerState
  extends PartiallyRequired<FormFieldProps, FieldOwnerStateCommonRequiredKeys | 'focused'> {}
