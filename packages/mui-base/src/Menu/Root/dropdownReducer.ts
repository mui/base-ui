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
      // TODO: move this check to the caller and not dispatch the action in the first place
      if (!state.listboxRef.current?.contains(action.event.relatedTarget)) {
        // To prevent the menu from closing when the focus leaves the menu to the button.
        // For more details, see https://github.com/mui/material-ui/pull/36917#issuecomment-1566992698
        const listboxId = state.listboxRef.current?.getAttribute('id');
        const controlledBy = action.event.relatedTarget?.getAttribute('aria-controls');
        if (listboxId && controlledBy && listboxId === controlledBy) {
          return state;
        }

        return {
          ...state,
          open: false,
          highlightedValue: state.items.first((item) => !item.disabled)?.value ?? null,
        };
      }

      return state;
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
  if (newState.highlightedValue === null && state.items.size > 0) {
    return {
      ...newState,
      highlightedValue: state.items.first((item) => !item.disabled)?.value ?? null,
    };
  }

  return state;
}
