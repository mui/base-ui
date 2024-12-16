export enum SelectTriggerDataAttributes {
  /**
   * Present when the corresponding select is open.
   */
  popupOpen = 'data-popup-open',
  /**
   * Present when the trigger is pressed.
   */
  pressed = 'data-pressed',
  /**
   * Present when the select is disabled.
   */
  disabled = 'data-disabled',
  /**
   * Present when the select is readonly.
   */
  readonly = 'data-readonly',
  /**
   * Present when the select is required.
   */
  required = 'data-required',
  /**
   * Present when the select is in valid state (when wrapped in Field.Root).
   */
  valid = 'data-valid',
  /**
   * Present when the select is in invalid state (when wrapped in Field.Root).
   */
  invalid = 'data-invalid',
  /**
   * Present when the select has been thouched (when wrapped in Field.Root).
   */
  touched = 'data-touched',
  /**
   * Present when the select's value has changed (when wrapped in Field.Root).
   */
  dirty = 'data-dirty',
}
