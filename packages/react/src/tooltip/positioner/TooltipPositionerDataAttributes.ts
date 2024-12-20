export enum TooltipPositionerDataAttributes {
  /**
   * Present when the tooltip is open.
   */
  open = 'data-open',
  /**
   * Present when the tooltip is closed.
   */
  closed = 'data-closed',
  /**
   * Present when the anchor is hidden.
   */
  anchorHidden = 'data-anchor-hidden',
  /**
   * Indicates which side the tooltip is positioned relative to the trigger.
   * @type {'top' | 'right' | 'bottom' | 'left'}
   */
  side = 'data-side',
}
