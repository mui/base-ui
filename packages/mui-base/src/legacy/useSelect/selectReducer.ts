import { moveHighlight, listReducer, ListActionTypes, handleItemSelection } from '../../useList';
import { SelectAction, SelectActionTypes, SelectInternalState } from './useSelect.types';

export function selectReducer<OptionValue>(
  state: SelectInternalState<OptionValue>,
  action: SelectAction<OptionValue>,
): SelectInternalState<OptionValue> {
  const { open, items, settings } = state;

  const { selectionMode } = settings;

  if (action.type === SelectActionTypes.buttonClick) {
    const itemToHighlight =
      state.selectedValues[0] ?? moveHighlight<OptionValue>(null, 'start', items, settings);

    return {
      ...state,
      open: !open,
      highlightedValue: !open ? itemToHighlight : null,
    };
  }

  if (action.type === SelectActionTypes.browserAutoFill) {
    return {
      ...state,
      ...handleItemSelection<OptionValue>(action.item, state),
    };
  }

  const newState: SelectInternalState<OptionValue> = listReducer(state, action);

  switch (action.type) {
    case ListActionTypes.keyDown:
      if (state.open) {
        if (action.event.key === 'Escape') {
          return {
            ...newState,
            open: false,
          };
        }
      } else {
        if (action.event.key === 'ArrowDown') {
          return {
            ...state,
            open: true,
            highlightedValue:
              state.selectedValues[0] ?? moveHighlight<OptionValue>(null, 'start', items, settings),
          };
        }

        if (action.event.key === 'ArrowUp') {
          return {
            ...state,
            open: true,
            highlightedValue:
              state.selectedValues[0] ?? moveHighlight<OptionValue>(null, 'end', items, settings),
          };
        }
      }

      break;

    case ListActionTypes.itemClick:
      if (selectionMode === 'single') {
        return {
          ...newState,
          open: false,
        };
      }

      break;

    case ListActionTypes.blur:
      return {
        ...newState,
        open: false,
      };

    default:
      return newState;
  }

  return newState;
}
