// import { FormFieldContextValue } from './FormFieldContext';

type RenderFunction = (
  props: React.ComponentPropsWithRef<'div'>,
  ownerState: any,
) => React.ReactNode;

export interface FormFieldProps {
  value?: unknown;
  defaultValue?: unknown;
  disabled?: boolean;
  invalid?: boolean;
  touched?: boolean;
  dirty?: boolean;
  error?: any;
  children?: React.ReactNode;
  render?: RenderFunction;
}

export interface FormFieldOwnerState extends FormFieldProps {
  focused: boolean;
}
