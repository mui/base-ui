// import { FormFieldContextValue } from './FormFieldContext';

type RenderFunction = (
  props: React.ComponentPropsWithRef<'div'>,
  ownerState: any,
) => React.ReactNode;

export interface FormFieldProps {
  id?: string;
  value?: unknown;
  defaultValue?: unknown;
  disabled?: boolean;
  invalid?: boolean;
  touched?: boolean;
  dirty?: boolean;
  // to consume `error` with a custom shape, Labels and such must use a custom render function
  error?: string | null | Record<string, unknown>;
  children?: React.ReactNode;
  render?: RenderFunction;
}

export interface FormFieldOwnerState extends FormFieldProps {
  focused: boolean;
}

export { FormFieldContextValue } from './FormFieldContext';
