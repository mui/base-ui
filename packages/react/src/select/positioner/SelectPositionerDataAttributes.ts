export enum SelectPositionerDataAttributes {
  /**
   * Present when the select popup is open.
   */
  open = 'data-open',
  /**
   * Present when the select popup is closed.
   */
  closed = 'data-unchecked',
  /**
   * Present when the anchor is hidden.
   */
  anchorHidden = 'data-anchor-hidden',
  /**
   * Indicates which side the select is positioned relative to the trigger.
   * @type {'none' | 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
   */
  side = 'data-side',
}
