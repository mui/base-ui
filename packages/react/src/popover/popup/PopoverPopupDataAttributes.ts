export enum PopoverPopupDataAttributes {
  /**
   * Present when the popup is open.
   */
  open = 'data-open',
  /**
   * Present when the popup is closed.
   */
  closed = 'data-closed',
  /**
   * Present when the popup is animating in.
   */
  startingStyle = 'data-starting-style',
  /**
   * Present when the popup is animating out.
   */
  endingStyle = 'data-ending-style',
  /**
   * Indicates which side the popup is positioned relative to the trigger.
   * @type {'none' | 'top' | 'right' | 'bottom' | 'left'}
   */
  side = 'data-side',
}
