import { BaseUIComponentProps } from '@base_ui/react/utils/BaseUI.types';

export interface DialogTriggerProps
  extends BaseUIComponentProps<'button', DialogTriggerOwnerState> {}

export interface DialogTriggerOwnerState {
  open: boolean;
  modal: boolean;
}

export interface UseDialogTriggerParameters {
  /**
   * Determines if the dialog is open.
   */
  open: boolean;
  /**
   * Callback to fire when the dialog is requested to be opened or closed.
   */
  onOpenChange: (open: boolean) => void;
  /**
   * The id of the popup element.
   */
  popupElementId: string | undefined;
}

export interface UseDialogTriggerReturnValue {
  /**
   * Resolver for the root element props.
   */
  getRootProps: (externalProps?: React.HTMLAttributes<any>) => React.HTMLAttributes<any>;
}
