import { FieldError } from './FormField.types';

export const FieldActionTypes = {
  touch: 'field:touch',
  untouch: 'field:untouch', // as an escape hatch
  focus: 'field:focus',
  blur: 'field:blur',
  changeValue: 'field:changeValue',
  setError: 'field:setError',
  clearError: 'field:clearError',
  // TODO: maybe add these actions
  // - clear: set the value to null, '', [] etc...
  // - reset: reset the the value to the initialValue
  // - changeValidationState: cycle error/warning/success/null
} as const;

// try to always pass event in Action always just so stateChangeCallback has a truthy event argument

interface FieldTouchAction {
  type: typeof FieldActionTypes.touch;
}

interface FieldUntouchAction {
  type: typeof FieldActionTypes.untouch;
}

interface FieldFocusAction {
  type: typeof FieldActionTypes.focus;
}

interface FieldBlurAction {
  type: typeof FieldActionTypes.blur;
}

interface FieldChangeValueAction {
  type: typeof FieldActionTypes.changeValue;
  value: unknown;
}

interface FieldSetErrorAction {
  type: typeof FieldActionTypes.setError;
  error?: FieldError;
}

interface FieldClearErrorAction {
  type: typeof FieldActionTypes.clearError;
}

export type FieldAction =
  | FieldTouchAction
  | FieldUntouchAction
  | FieldFocusAction
  | FieldBlurAction
  | FieldChangeValueAction
  | FieldSetErrorAction
  | FieldClearErrorAction;
