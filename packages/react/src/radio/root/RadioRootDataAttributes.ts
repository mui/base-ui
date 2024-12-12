export enum RadioRootDataAttributes {
  /**
   * Present when the radio is checked.
   */
  checked = 'data-checked',
  /**
   * Present when the radio is not checked.
   */
  unchecked = 'data-unchecked',
  /**
   * Present when the radio is disabled.
   */
  disabled = 'data-disabled',
  /**
   * Present when the radio is readonly.
   */
  readonly = 'data-readonly',
  /**
   * Present when the radio is required.
   */
  required = 'data-required',
  /**
   * Present when the radio is in valid state (when wrapped in Field.Root)..
   */
  valid = 'data-valid',
  /**
   * Present when the radio is in invalid state (when wrapped in Field.Root).
   */
  invalid = 'data-invalid',
  /**
   * Present when the radio has been thouched (when wrapped in Field.Root).
   */
  touched = 'data-touched',
  /**
   * Present when the radio's value has changed (when wrapped in Field.Root).
   */
  dirty = 'data-dirty',
}
