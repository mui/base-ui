import type { DialogRootProps, UseDialogRootReturnValue } from '../../Dialog/Root/DialogRoot.types';

export type AlertDialogRootProps = Omit<DialogRootProps, 'modal' | 'dismissible'>;

export interface AlertDialogRootContextValue extends UseDialogRootReturnValue {
  /**
   * If `true`, the dialog supports CSS-based animations and transitions.
   * It is kept in the DOM until the animation completes.
   */
  animated: boolean;
  /**
   * Determines if the dialog is nested within a parent dialog.
   */
  hasParentDialog: boolean;
}
