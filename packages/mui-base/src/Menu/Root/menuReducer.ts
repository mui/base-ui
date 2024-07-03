import { ListAction, ListActionTypes, ListState, listReducer, moveHighlight } from '../../useList';

export const MenuActionTypes = {
  toggle: 'menu:toggle',
  open: 'menu:open',
  close: 'menu:close',
  registerPopup: 'menu:registerPopup',
  registerTrigger: 'menu:registerTrigger',
  registerPositioner: 'menu:registerPositioner',
  resetClickAndDragging: 'menu:resetClickAndDragging',
} as const;

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
      const updateHighlight = action.event instanceof window.KeyboardEvent;
      const clickAndDragging = action.event?.type === 'mousedown';

      return {
        ...state,
        open: true,
        highlightedValue: updateHighlight
          ? moveHighlight(null, 'start', state.items, state.settings)
          : state.highlightedValue,
        clickAndDragging,
      };
    }

    case MenuActionTypes.resetClickAndDragging:
      return { ...state, clickAndDragging: false };

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

interface MenuToggleAction {
  type: typeof MenuActionTypes.toggle;
  event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent | null;
}

interface MenuOpenAction {
  type: typeof MenuActionTypes.open;
  event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent | Event | null;
  highlightRequest?: 'first' | 'last';
}

interface MenuCloseAction {
  type: typeof MenuActionTypes.close;
  event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent | Event | null;
}

interface MenuRegisterPopupAction {
  type: typeof MenuActionTypes.registerPopup;
  popupId: string | null;
}

interface MenuRegisterTriggerAction {
  type: typeof MenuActionTypes.registerTrigger;
  triggerElement: HTMLElement | null;
}

interface MenuRegisterPositionerAction {
  type: typeof MenuActionTypes.registerPositioner;
  positionerElement: HTMLElement | null;
}

interface MenuResetClickAndDraggingAction {
  type: typeof MenuActionTypes.resetClickAndDragging;
}

export type MenuReducerAction =
  | MenuToggleAction
  | MenuOpenAction
  | MenuCloseAction
  | MenuRegisterPopupAction
  | MenuRegisterTriggerAction
  | MenuRegisterPositionerAction
  | MenuResetClickAndDraggingAction
  | ListAction<string>;

export type MenuReducerState = ListState<string> & {
  open: boolean;
  popupId: string | null;
  triggerElement: HTMLElement | null;
  positionerElement: HTMLElement | null;
  hasNestedMenuOpen: boolean;
  clickAndDragging: boolean;
};
