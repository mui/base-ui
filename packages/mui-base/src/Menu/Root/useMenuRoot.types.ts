import { FloatingRootContext } from '@floating-ui/react';
import { ListAction, ListState } from '../../useList';
import { GenericHTMLProps } from '../../utils/types';

export type MenuOrientation = 'horizontal' | 'vertical';
export type MenuDirection = 'ltr' | 'rtl';

export interface UseMenuRootParameters {
  /**
   * If `true`, the dropdown is initially open.
   */
  defaultOpen?: boolean;
  onHighlightChange?: (
    value: string | null,
    reason: string,
    event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent | null,
  ) => void;
  /**
   * Callback fired when the component requests to be opened or closed.
   */
  onOpenChange?: (
    event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent | null,
    open: boolean,
  ) => void;
  /**
   * Allows to control whether the dropdown is open.
   * This is a controlled counterpart of `defaultOpen`.
   */
  open?: boolean;
  parentState?: MenuReducerState;
  orientation: MenuOrientation;
  direction: MenuDirection;
}

export interface UseMenuRootReturnValue {
  state: MenuReducerState;
  dispatch: React.Dispatch<MenuReducerAction>;
  floatingRootContext: FloatingRootContext;
  getTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  getPositionerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  getItemProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}

export const MenuActionTypes = {
  toggle: 'menu:toggle',
  open: 'menu:open',
  close: 'menu:close',
  registerPopup: 'menu:registerPopup',
  registerTrigger: 'menu:registerTrigger',
  registerPositioner: 'menu:registerPositioner',
} as const;

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

export type MenuReducerAction =
  | MenuToggleAction
  | MenuOpenAction
  | MenuCloseAction
  | MenuRegisterPopupAction
  | MenuRegisterTriggerAction
  | MenuRegisterPositionerAction
  | ListAction<string>;

export type MenuReducerState = ListState<string> & {
  open: boolean;
  popupId: string | null;
  triggerElement: HTMLElement | null;
  positionerElement: HTMLElement | null;
  hasNestedMenuOpen: boolean;
};
