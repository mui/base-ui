import { TransitionStatusDataAttributes } from '../../utils/stateAttributesMapping';

export enum FieldErrorDataAttributes {
  /**
   * Present when the field is disabled.
   */
  disabled = 'data-disabled',
  /**
   * Present when the field is in valid state.
   */
  valid = 'data-valid',
  /**
   * Present when the field is in invalid state.
   */
  invalid = 'data-invalid',
  /**
   * Present when the field has been touched.
   */
  touched = 'data-touched',
  /**
   * Present when the field's value has changed.
   */
  dirty = 'data-dirty',
  /**
   * Present when the field is filled.
   */
  filled = 'data-filled',
  /**
   * Present when the field control is focused.
   */
  focused = 'data-focused',
  /**
   * Present when the error message is animating in.
   */
  startingStyle = TransitionStatusDataAttributes.startingStyle,
  /**
   * Present when the error message is animating out.
   */
  endingStyle = TransitionStatusDataAttributes.endingStyle,
}
