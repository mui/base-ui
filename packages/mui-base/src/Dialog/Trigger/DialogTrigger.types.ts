import { BaseUIComponentProps } from '@base_ui/react/utils/BaseUI.types';

export interface DialogTriggerProps
  extends BaseUIComponentProps<'button', DialogTriggerOwnerState> {}

export interface DialogTriggerOwnerState {
  open: boolean;
  modal: boolean;
}

export interface UseDialogTriggerParameters {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  popupElementId: string | undefined;
}

export interface UseDialogTriggerReturnValue {
  getRootProps: (otherProps?: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
}
