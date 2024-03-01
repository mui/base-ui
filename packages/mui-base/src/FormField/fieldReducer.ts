import { FieldState, FieldReducerAction } from './FormField.types';
import { FieldActionTypes } from './fieldAction.types';

export function fieldReducer(state: FieldState, action: FieldReducerAction): FieldState {
  const { type } = action;

  switch (type) {
    case FieldActionTypes.touch:
      return {
        ...state,
        touched: true,
      };
    case FieldActionTypes.untouch:
      return {
        ...state,
        touched: false,
      };
    case FieldActionTypes.focus:
      return {
        ...state,
        focused: true,
        touched: true,
      };
    case FieldActionTypes.blur:
      return {
        ...state,
        focused: false,
      };
    case FieldActionTypes.changeValue:
      return {
        ...state,
        value: action.value,
      };
    case FieldActionTypes.setError:
      return {
        ...state,
        invalid: true,
        error: action?.error ?? null,
      };
    case FieldActionTypes.clearError:
      return {
        ...state,
        invalid: false,
        error: null,
      };
    default:
      return state;
  }
}
