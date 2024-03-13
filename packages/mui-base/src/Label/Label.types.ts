import { PartiallyRequired } from '@mui/types';
import { FormFieldContextValue, FieldOwnerStateCommonRequiredKeys } from '../FormField';

type RenderFunction = (
  props: React.ComponentPropsWithRef<'label'>,
  ownerState: any,
) => React.ReactNode;

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  dirty?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  touched?: boolean;
  children?: React.ReactNode;
  render?: RenderFunction;
}

export interface LabelOwnerState
  extends PartiallyRequired<LabelProps, FieldOwnerStateCommonRequiredKeys> {
  field?: FormFieldContextValue;
  focused: boolean;
}
