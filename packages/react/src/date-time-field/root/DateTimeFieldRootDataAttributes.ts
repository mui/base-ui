export enum DateTimeFieldRootDataAttributes {
  /**
   * Present when the date-time field is disabled.
   */
  disabled = 'data-disabled',
  /**
   * Present when the date-time field is readonly.
   */
  readonly = 'data-readonly',
  /**
   * Present when the date-time field is required.
   */
  required = 'data-required',
  /**
   * Present when the date-time field is in valid state (when wrapped in Field.Root).
   */
  valid = 'data-valid',
  /**
   * Present when the date-time field is in invalid state (when wrapped in Field.Root).
   */
  invalid = 'data-invalid',
  /**
   * Present when the date-time field has been touched (when wrapped in Field.Root).
   */
  touched = 'data-touched',
  /**
   * Present when the date-time field's value has changed (when wrapped in Field.Root).
   */
  dirty = 'data-dirty',
  /**
   * Present when the date-time field is filled (when wrapped in Field.Root).
   */
  filled = 'data-filled',
  /**
   * Present when the date-time field is focused (when wrapped in Field.Root).
   */
  focused = 'data-focused',
}
