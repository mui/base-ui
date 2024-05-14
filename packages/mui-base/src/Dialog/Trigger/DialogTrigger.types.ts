export interface DialogTriggerProps {
  children: React.ReactElement;
}

export interface UseDialogTriggerParameters {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  popupElementId: string | undefined;
}

export interface UseDialogTriggerReturnValue {
  getRootProps: (otherProps?: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
}
