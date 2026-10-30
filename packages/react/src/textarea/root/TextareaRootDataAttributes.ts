export enum TextareaRootDataAttributes {
  /**
   * Present when the textarea is disabled.
   */
  disabled = 'data-disabled',
  /**
   * Present when the textarea is in a valid state (when wrapped in Field.Root).
   */
  valid = 'data-valid',
  /**
   * Present when the textarea is in an invalid state (when wrapped in Field.Root).
   */
  invalid = 'data-invalid',
  /**
   * Present when the textarea has been touched (when wrapped in Field.Root).
   */
  touched = 'data-touched',
  /**
   * Present when the textarea's value has changed (when wrapped in Field.Root).
   */
  dirty = 'data-dirty',
  /**
   * Present when the textarea has a value (when wrapped in Field.Root).
   */
  filled = 'data-filled',
  /**
   * Present when the textarea is focused (when wrapped in Field.Root).
   */
  focused = 'data-focused',
}
