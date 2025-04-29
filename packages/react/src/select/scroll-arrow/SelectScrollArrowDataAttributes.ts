export enum SelectScrollArrowDataAttributes {
  /**
   * Indicates the direction of the arrow.
   * @type {'up' | 'down'}
   */
  direction = 'data-direction',
  /**
   * Present when the arrow is visible.
   */
  visible = 'data-visible',
  /**
   * Indicates which side the popup is positioned relative to the trigger.
   * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
   */
  side = 'data-side',
  /**
   * Indicates how the popup is aligned relative to specified side.
   * @type {'start' | 'center' | 'end'}
   */
  align = 'data-align',
}
