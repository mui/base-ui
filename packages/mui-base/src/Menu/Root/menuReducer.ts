import { ListActionTypes, listReducer, moveHighlight } from '../../useList';
import { MenuReducerAction, MenuActionTypes, MenuReducerState } from './useMenuRoot.types';

export function menuReducer(state: MenuReducerState, action: MenuReducerAction): MenuReducerState {
  switch (action.type) {
    case ListActionTypes.itemHover:
      return {
        ...state,
        highlightedValue: action.item,
      };

    case MenuActionTypes.toggle:
      return {
        ...state,
        open: !state.open,
        highlightedValue: state.open
          ? null
          : moveHighlight(null, 'start', state.items, state.settings),
      };

    case MenuActionTypes.open:
      return {
        ...state,
        open: true,
        highlightedValue:
          action.highlightRequest === 'last'
            ? moveHighlight(null, 'end', state.items, state.settings)
            : moveHighlight(null, 'start', state.items, state.settings),
      };

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
