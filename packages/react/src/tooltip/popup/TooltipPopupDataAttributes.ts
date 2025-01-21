export enum TooltipPopupDataAttributes {
  /**
   * Present when the tooltip is open.
   */
  open = 'data-open',
  /**
   * Present when the tooltip is closed.
   */
  closed = 'data-closed',
  /**
   * Present when the tooltip is animating in.
   */
  startingStyle = 'data-starting-style',
  /**
   * Present when the tooltip is animating out.
   */
  endingStyle = 'data-ending-style',
  /**
   * Indicates which side the tooltip is positioned relative to the trigger.
   * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
   */
  side = 'data-side',
  /**
   * Present if animations should be instant.
   * @type {'delay' | 'dismiss' | 'focus'}
   */
  instant = 'data-instant',
}
