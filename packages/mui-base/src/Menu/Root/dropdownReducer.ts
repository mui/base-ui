import { ListActionTypes, listReducer } from '../../useList';
import { MenuReducerAction, DropdownActionTypes, MenuReducerState } from './useMenuRoot.types';

export function dropdownReducer(
  state: MenuReducerState,
  action: MenuReducerAction,
): MenuReducerState {
  switch (action.type) {
    case ListActionTypes.itemHover:
      return {
        ...state,
        highlightedValue: action.item,
      };
    case DropdownActionTypes.blur:
      return { ...state, open: false, changeReason: action.event };
    case DropdownActionTypes.escapeKeyDown:
      return { ...state, open: false, changeReason: action.event };
    case DropdownActionTypes.toggle:
      return { ...state, open: !state.open, changeReason: action.event };
    case DropdownActionTypes.open:
      return { ...state, open: true, changeReason: action.event };
    case DropdownActionTypes.close:
      return { ...state, open: false, changeReason: action.event };
    default:
  }

  const newState = listReducer<string, MenuReducerState>(state, action);
  // make sure an item is always highlighted
  if (newState.highlightedValue === null && state.items.length > 0) {
    return {
      ...newState,
      highlightedValue: state.items[0],
    };
  }

  return state;
}
