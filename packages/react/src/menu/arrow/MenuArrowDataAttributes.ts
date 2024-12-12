export enum MenuArrowDataAttributes {
  /**
   * Present when the menu popup is open.
   */
  open = 'data-open',
  /**
   * Present when the menu popup is closed.
   */
  closed = 'data-unchecked',
  /**
   * Present when the anchor is hidden.
   */
  anchorHidden = 'data-anchor-hidden',
  /**
   * Indicates which side the menu is positioned relative to the trigger.
   * @type {'none' | 'top' | 'right' | 'bottom' | 'left'}
   */
  side = 'data-side',
}
