import { FormFieldContextValue } from '../FormField';

type RenderFunction = (
  props: React.ComponentPropsWithRef<'label'>,
  ownerState: any,
) => React.ReactNode;

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  disabled?: boolean;
  invalid?: boolean;
  touched?: boolean;
  dirty?: boolean;
  children?: React.ReactNode;
  render?: RenderFunction;
}

export interface LabelOwnerState extends LabelProps {
  focused?: boolean;
  field?: FormFieldContextValue;
}
