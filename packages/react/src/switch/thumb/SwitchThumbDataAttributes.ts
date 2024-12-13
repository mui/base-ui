export enum SwitchThumbDataAttributes {
  /**
   * Present when the switch is checked.
   */
  checked = 'data-checked',
  /**
   * Present when the switch is not checked.
   */
  unchecked = 'data-unchecked',
  /**
   * Present when the switch is disabled.
   */
  disabled = 'data-disabled',
  /**
   * Present when the switch is readonly.
   */
  readonly = 'data-readonly',
  /**
   * Present when the switch is required.
   */
  required = 'data-required',
  /**
   * Present when the switch is in valid state (when wrapped in Field.Root)..
   */
  valid = 'data-valid',
  /**
   * Present when the switch is in invalid state (when wrapped in Field.Root).
   */
  invalid = 'data-invalid',
  /**
   * Present when the switch has been thouched (when wrapped in Field.Root).
   */
  touched = 'data-touched',
  /**
   * Present when the switch's value has changed (when wrapped in Field.Root).
   */
  dirty = 'data-dirty',
}
