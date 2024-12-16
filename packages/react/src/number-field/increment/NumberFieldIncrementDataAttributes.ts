export enum NumberFieldIncrementDataAttributes {
  /**
   * Present while scrubbing.
   */
  scrubbing = 'data-scrubbing',
  /**
   * Present when the number field is disabled.
   */
  disabled = 'data-disabled',
  /**
   * Present when the number field is readonly.
   */
  readonly = 'data-readonly',
  /**
   * Present when the number field is required.
   */
  required = 'data-required',
  /**
   * Present when the number field is in valid state (when wrapped in Field.Root).
   */
  valid = 'data-valid',
  /**
   * Present when the number field is in invalid state (when wrapped in Field.Root).
   */
  invalid = 'data-invalid',
  /**
   * Present when the number field has been touched (when wrapped in Field.Root).
   */
  touched = 'data-touched',
  /**
   * Present when the number field's value has changed (when wrapped in Field.Root).
   */
  dirty = 'data-dirty',
}
