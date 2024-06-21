import { TabsListActionTypes, ValueChangeAction } from './TabsList.types';
import {
  ListState,
  ListAction,
  ListSettings,
  listReducer,
  ListActionTypes,
  moveHighlight,
} from '../../useList';

export interface TabsReducerState extends ListState<any> {
  tabsListRef: React.RefObject<HTMLElement>;
  settings: ListSettings & { activateOnFocus: boolean };
}

export type TabsReducerAction = ListAction<any> | ValueChangeAction;

export function tabsListReducer(state: TabsReducerState, action: TabsReducerAction) {
  if (action.type === TabsListActionTypes.valueChange) {
    return {
      ...state,
      highlightedValue: action.value,
    };
  }

  const newState = listReducer(state, action);

  if (action.type === ListActionTypes.itemsChange) {
    if (newState.selectedValues.length > 0) {
      return {
        ...newState,
        highlightedValue: newState.selectedValues[0],
      };
    }

    moveHighlight(null, 'reset', state.items, state.settings);
  }

  if (state.settings.activateOnFocus && newState.highlightedValue != null) {
    return {
      ...newState,
      selectedValues: [newState.highlightedValue],
    };
  }

  return newState;
}
