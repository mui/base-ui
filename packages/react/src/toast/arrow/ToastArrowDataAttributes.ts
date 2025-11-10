export enum ToastArrowDataAttributes {
  /**
   * Indicates which side the toast is positioned relative to the anchor.
   * @type {'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
   */
  side = 'data-side',
  /**
   * Indicates how the toast is aligned relative to specified side.
   * @type {'start' | 'center' | 'end'}
   */
  align = 'data-align',
  /**
   * Present when the toast arrow is uncentered.
   */
  uncentered = 'data-uncentered',
}
