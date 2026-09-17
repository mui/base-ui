import { CommonPopupDataAttributes } from '../../utils/popupStateMapping';

/**
 * Present when the dialog is open.
 */
export const open = CommonPopupDataAttributes.open;
/**
 * Present when the dialog is closed.
 */
export const closed = CommonPopupDataAttributes.closed;
/**
 * Present when the dialog begins animating in.
 */
export const startingStyle = CommonPopupDataAttributes.startingStyle;
/**
 * Present when the dialog is animating out.
 */
export const endingStyle = CommonPopupDataAttributes.endingStyle;
/**
 * Present when the dialog is nested within another dialog.
 */
export const nested = 'data-nested';
/**
 * Present when the dialog has other open dialogs nested within it.
 */
export const nestedDialogOpen = 'data-nested-dialog-open';
