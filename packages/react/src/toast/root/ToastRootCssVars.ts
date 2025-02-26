export const ToastRootCssVars = {
  /**
   * Indicates the index of the toast in its stack.
   * @type {number}
   */
  index: '--toast-index',
  /**
   * Indicates the offset of the toast in its stack.
   * @type {number}
   */
  offset: '--toast-offset',
  /**
   * Indicates the momentum of the toast swipe gesture.
   * Used to adjust animation speed when dismissing.
   * @type {number}
   */
  momentum: '--toast-momentum',
} as const;
