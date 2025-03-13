export enum ToastRootDataAttributes {
  /**
   * Indicates the toast is being swiped.
   * @type {boolean}
   */
  swiping = 'data-swiping',
  /**
   * Indicates the toast is expanded in the viewport.
   * @type {boolean}
   */
  expanded = 'data-expanded',
  /**
   * Indicates the toast was removed due to exceeding the limit.
   * @type {boolean}
   */
  limited = 'data-limited',
  /**
   * The type of the toast.
   * @type {string}
   */
  type = 'data-type',
}
