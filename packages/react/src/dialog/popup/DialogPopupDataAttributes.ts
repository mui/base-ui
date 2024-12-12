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
   * Indicates how many dialogs are nested within.
   * @type {number}
   */
  nestedDialogs = 'data-nested-dialogs',
}
