export enum SelectPopupDataAttributes {
  /**
   * Present when the select is open.
   */
  open = 'data-open',
  /**
   * Present when the select is closed.
   */
  closed = 'data-closed',
  /**
   * Present when the select is animating in.
   */
  startingStyle = 'data-starting-style',
  /**
   * Present when the select is animating out.
   */
  endingStyle = 'data-ending-style',
  /**
   * Indicates which side the select is positioned relative to the trigger.
   * @type {'none' | 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
   */
  side = 'data-side',
}
