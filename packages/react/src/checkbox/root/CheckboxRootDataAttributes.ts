export enum CheckboxRootDataAttributes {
  /**
   * Present when the checkbox is checked.
   */
  checked = 'data-checked',
  /**
   * Present when the checkbox is not checked.
   */
  unchecked = 'data-unchecked',
  /**
   * Present when the checkbox is disabled.
   */
  disabled = 'data-disabled',
  /**
   * Present when the checkbox is readonly.
   */
  readonly = 'data-readonly',
  /**
   * Present when the checkbox is required.
   */
  required = 'data-required',
  /**
   * Present when the checkbox is in valid state (when wrapped in Field.Root)..
   */
  valid = 'data-valid',
  /**
   * Present when the checkbox is in invalid state (when wrapped in Field.Root).
   */
  invalid = 'data-invalid',
  /**
   * Present when the checkbox has been thouched (when wrapped in Field.Root).
   */
  touched = 'data-touched',
  /**
   * Present when the checkbox's value has changed (when wrapped in Field.Root).
   */
  dirty = 'data-dirty',
}
