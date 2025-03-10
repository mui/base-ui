export enum ToastRootCssVars {
  /**
   * Indicates the index of the toast in the list.
   * @type {number}
   */
  index = '--toast-index',
  /**
   * Indicates the offset of the toast in the list.
   * @type {number}
   */
  offset = '--toast-offset',
  /**
   * Indicates the direction the toast is swiped.
   * @type {'up' | 'down' | 'left' | 'right'}
   */
  swipeDirection = '--toast-swipe-direction',
  /**
   * Indicates the horizontal swipe movement of the toast.
   * @type {number}
   */
  swipeMoveX = '--toast-swipe-move-x',
  /**
   * Indicates the vertical swipe movement of the toast.
   * @type {number}
   */
  swipeMoveY = '--toast-swipe-move-y',
}
