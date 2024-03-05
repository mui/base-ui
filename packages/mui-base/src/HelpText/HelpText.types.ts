import { PartiallyRequired } from '@mui/types';
import { FormFieldContextValue, FieldOwnerStateCommonRequiredKeys } from '../FormField';

type RenderFunction = (
  props: React.ComponentPropsWithRef<'span'>,
  ownerState: any,
) => React.ReactNode;

export interface HelpTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  disabled?: boolean;
  invalid?: boolean;
  touched?: boolean;
  dirty?: boolean;
  children?: React.ReactNode;
  render?: RenderFunction;
}

export interface HelpTextOwnerState
  extends PartiallyRequired<HelpTextProps, FieldOwnerStateCommonRequiredKeys> {
  field?: FormFieldContextValue;
  focused: boolean;
}
