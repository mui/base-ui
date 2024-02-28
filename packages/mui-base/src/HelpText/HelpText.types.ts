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

export interface HelpTextOwnerState extends HelpTextProps {
  focused?: boolean;
}
