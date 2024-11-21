import {
  ListState,
  ListAction,
  ListActionContext,
  listReducer,
  ListActionTypes,
  moveHighlight,
} from '../../useList';
import { ActionWithContext } from '../../utils/useControllableReducer.types';

export type TabsListActionContext = ListActionContext<any> & {
  activateOnFocus: boolean;
};

export const TabsListActionTypes = {
  valueChange: 'valueChange',
} as const;

export interface ValueChangeAction {
  type: typeof TabsListActionTypes.valueChange;
  value: any | null;
}

export function tabsListReducer(
  state: ListState<any>,
  action: ActionWithContext<ListAction<any> | ValueChangeAction, TabsListActionContext>,
) {
  if (action.type === TabsListActionTypes.valueChange) {
    return {
      ...state,
      highlightedValue: action.value,
    };
  }

  const newState = listReducer(state, action);

  const {
    context: { activateOnFocus },
  } = action;

  if (action.type === ListActionTypes.itemsChange) {
    if (newState.selectedValues.length > 0) {
      return {
        ...newState,
        highlightedValue: newState.selectedValues[0],
      };
    }

    moveHighlight(null, 'reset', action.context);
  }

  if (activateOnFocus && newState.highlightedValue != null) {
    return {
      ...newState,
      selectedValues: [newState.highlightedValue],
    };
  }

  return newState;
}
