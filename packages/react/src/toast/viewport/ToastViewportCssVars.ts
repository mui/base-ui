export enum ToastViewportCssVars {
  /**
   * Indicates the height of the frontmost toast.
   * Each `Toast.Root` shadows this value with the height of its own group's frontmost toast.
   * @type {number}
   */
  frontmostHeight = '--toast-frontmost-height',
}
