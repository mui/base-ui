export enum ScrollAreaScrollbarDataAttributes {
  /**
   * Indicates the orientation of the scrollbar.
   * @type {'horizontal' | 'vertical'}
   */
  orientation = 'data-orientation',
  /**
   * Present when the pointer is over the scroll area.
   */
  hovering = 'data-hovering',
  /**
   * Present when the users scrolls inside the scroll area.
   */
  scrolling = 'data-scrolling',
  /**
   * Present when the scroll area content is wider than the viewport.
   */
  hasOverflowX = 'data-has-overflow-x',
  /**
   * Present when the scroll area content is taller than the viewport.
   */
  hasOverflowY = 'data-has-overflow-y',
  /**
   * Present when there is overflow on the inline start side for the horizontal axis.
   */
  overflowXStart = 'data-overflow-x-start',
  /**
   * Present when there is overflow on the inline end side for the horizontal axis.
   */
  overflowXEnd = 'data-overflow-x-end',
  /**
   * Present when there is overflow on the block start (top) side.
   */
  overflowYStart = 'data-overflow-y-start',
  /**
   * Present when there is overflow on the block end (bottom) side.
   */
  overflowYEnd = 'data-overflow-y-end',
}
