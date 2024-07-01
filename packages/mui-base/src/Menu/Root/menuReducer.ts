import { ListActionTypes, listReducer, moveHighlight } from '../../useList';
import { MenuReducerAction, MenuActionTypes, MenuReducerState } from './useMenuRoot.types';

export function menuReducer(state: MenuReducerState, action: MenuReducerAction): MenuReducerState {
  switch (action.type) {
    case ListActionTypes.itemHover:
      return state;

    case MenuActionTypes.toggle:
      return {
        ...state,
        open: !state.open,
      };

    case MenuActionTypes.open: {
      const updateHighlight = action.event instanceof KeyboardEvent;

      return {
        ...state,
        open: true,
        highlightedValue: updateHighlight
          ? moveHighlight(null, 'start', state.items, state.settings)
          : state.highlightedValue,
      };
    }

    case MenuActionTypes.close:
      return { ...state, open: false };

    case MenuActionTypes.registerPopup:
      return { ...state, popupId: action.popupId };

    case MenuActionTypes.registerTrigger:
      return { ...state, triggerElement: action.triggerElement };

    case MenuActionTypes.registerPositioner:
      return { ...state, positionerElement: action.positionerElement };

    default:
  }

  const newState = listReducer<string, MenuReducerState>(state, action);

  return newState;
}
