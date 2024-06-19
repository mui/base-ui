import { ListAction, ListState } from '../../useList';
import type { MenuRootContextValue } from './MenuRootContext';

export interface UseMenuRootParameters {
  /**
   * If `true`, the dropdown is initially open.
   */
  defaultOpen?: boolean;
  getItemDomElement?: (itemValue: string) => HTMLElement | null;
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
}

export interface UseMenuRootReturnValue {
  /**
   * The value to be passed into the DropdownContext provider.
   */
  contextValue: MenuRootContextValue;
  /**
   * If `true`, the dropdown is open.
   */
  open: boolean;
}

export const MenuActionTypes = {
  blur: 'menu:blur',
  escapeKeyDown: 'menu:escapeKeyDown',
  toggle: 'menu:toggle',
  open: 'menu:open',
  close: 'menu:close',
} as const;

interface MenuBlurAction {
  type: typeof MenuActionTypes.blur;
  event: React.FocusEvent;
}

interface MenuEscapeKeyDownAction {
  type: typeof MenuActionTypes.escapeKeyDown;
  event: React.KeyboardEvent;
}

interface MenuToggleAction {
  type: typeof MenuActionTypes.toggle;
  event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent | null;
}

interface MenuOpenAction {
  type: typeof MenuActionTypes.open;
  event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent | null;
}

interface MenuCloseAction {
  type: typeof MenuActionTypes.close;
  event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent | null;
}

export type MenuReducerAction =
  | MenuBlurAction
  | MenuEscapeKeyDownAction
  | MenuToggleAction
  | MenuOpenAction
  | MenuCloseAction
  | ListAction<string>;

export type MenuReducerState = ListState<string> & {
  open: boolean;
  changeReason: React.MouseEvent | React.KeyboardEvent | React.FocusEvent | null;
  listboxRef: React.RefObject<HTMLElement>;
};
