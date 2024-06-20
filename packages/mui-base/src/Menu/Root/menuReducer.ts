import { ListActionTypes, listReducer } from '../../useList';
import { MenuReducerAction, MenuActionTypes, MenuReducerState } from './useMenuRoot.types';

export function menuReducer(state: MenuReducerState, action: MenuReducerAction): MenuReducerState {
  switch (action.type) {
    case ListActionTypes.itemHover:
      return {
        ...state,
        highlightedValue: action.item,
      };

    case MenuActionTypes.blur:
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
    case MenuActionTypes.escapeKeyDown:
      return { ...state, open: false, changeReason: action.event };

    case MenuActionTypes.toggle:
      return {
        ...state,
        open: !state.open,
        changeReason: action.event,
        highlightedValue: state.open
          ? null
          : state.items.first((item) => !item.disabled)?.value ?? null,
      };

    case MenuActionTypes.open:
      return {
        ...state,
        open: true,
        changeReason: action.event,
        highlightedValue: state.items.first((item) => !item.disabled)?.value ?? null,
      };

    case MenuActionTypes.close:
      return { ...state, open: false, changeReason: action.event };

    default:
  }

  const newState = listReducer<string, MenuReducerState>(state, action);

  return newState;
}
