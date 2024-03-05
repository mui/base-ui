export const FieldActionTypes = {
  untouch: 'field:untouch', // as an escape hatch
  focus: 'field:focus',
  blur: 'field:blur',
  changeValue: 'field:changeValue',
  initializeValue: 'field:initializeValue',
  setError: 'field:setError',
  clearError: 'field:clearError',
  // TODO: maybe add these actions
  // - clear: set the value to null, '', [] etc...
  // - reset: reset the the value to the initialValue
  // - changeValidationState: cycle error/warning/success/null
} as const;

export type FieldError = string | null | Record<string, unknown>; // this could be expanded to sth to the effect of `validationResult`

// try to always pass event in Action always just so stateChangeCallback has a truthy event argument

interface FieldUntouchAction {
  type: typeof FieldActionTypes.untouch;
}

interface FieldFocusAction {
  type: typeof FieldActionTypes.focus;
  event: React.FocusEvent | null;
}

interface FieldBlurAction {
  type: typeof FieldActionTypes.blur;
  event: React.FocusEvent | null;
}

interface FieldChangeValueAction {
  type: typeof FieldActionTypes.changeValue;
  event:
    | React.MouseEvent<Element, MouseEvent>
    | React.KeyboardEvent<Element>
    | React.FocusEvent<Element, Element>
    | null;
  value: unknown;
}

interface FieldInitializeValueAction {
  type: typeof FieldActionTypes.initializeValue;
  event:
    | React.MouseEvent<Element, MouseEvent>
    | React.KeyboardEvent<Element>
    | React.FocusEvent<Element, Element>
    | null;
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
  | FieldUntouchAction
  | FieldFocusAction
  | FieldBlurAction
  | FieldChangeValueAction
  | FieldInitializeValueAction
  | FieldSetErrorAction
  | FieldClearErrorAction;
