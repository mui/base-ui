export enum MenuPopupDataAttributes {
  /**
   * Present when the menu is open.
   */
  open = 'data-open',
  /**
   * Present when the menu is closed.
   */
  closed = 'data-closed',
  /**
   * Present when the menu is animating in.
   */
  startingStyle = 'data-starting-style',
  /**
   * Present when the menu is animating out.
   */
  endingStyle = 'data-ending-style',
  /**
   * Indicates which side the menu is positioned relative to the trigger.
   * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
   */
  side = 'data-side',
  /**
   * Indicates the instant type of the popover popup.
   * @type {'click' | 'dismiss'}
   */
  instant = 'data-instant',
}
