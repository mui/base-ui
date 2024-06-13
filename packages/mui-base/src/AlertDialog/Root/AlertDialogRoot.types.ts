import type { DialogRootProps, UseDialogRootReturnValue } from '../../Dialog/Root/DialogRoot.types';

export type AlertDialogRootProps = Omit<
  DialogRootProps,
  'modal' | 'dismissible' | 'keyboardDismissible'
>;

export interface AlertDialogRootContextValue extends UseDialogRootReturnValue {
  /**
   * Determines if the dialog is nested within a parent dialog.
   */
  hasParentDialog: boolean;
}
