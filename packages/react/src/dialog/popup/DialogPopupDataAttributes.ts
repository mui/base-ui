export enum DialogPopupDataAttributes {
  /**
   * Present when the dialog is open.
   */
  open = 'data-open',
  /**
   * Present when the dialog is closed.
   */
  closed = 'data-closed',
  /**
   * Present when the dialog is animating in.
   */
  startingStyle = 'data-starting-style',
  /**
   * Present when the dialog is animating out.
   */
  endingStyle = 'data-ending-style',
  /**
   * Present when the dialog is nested within another dialog.
   */
  nested = 'data-nested',
  /**
   * Present when the dialog has other open dialogs nested within it.
   */
  nestedDialogOpen = 'data-nested-dialog-open',
}
