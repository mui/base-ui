export enum PopoverArrowDataAttributes {
  /**
   * Present when the popup is open.
   */
  open = 'data-open',
  /**
   * Present when the popup is closed.
   */
  closed = 'data-unchecked',
  /**
   * Present when the anchor is hidden.
   */
  anchorHidden = 'data-anchor-hidden',
  /**
   * Indicates which side the popup is positioned relative to the trigger.
   * @type {'none' | 'top' | 'right' | 'bottom' | 'left'}
   */
  side = 'data-side',
  /**
   * Present when the popover arrow is uncentered.
   */
  uncetered = 'data-uncentered',
}
