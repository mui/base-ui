export interface DialogTriggerProps {
  children: React.ReactElement;
}

export interface UseDialogTriggerReturnValue {
  getRootProps: (otherProps?: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
  open: boolean;
  modal: boolean;
}
