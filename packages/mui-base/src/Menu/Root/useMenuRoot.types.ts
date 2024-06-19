import { ListAction, ListState } from '../../useList';
import type { MenuRootContextValue } from './MenuRootContext';

export interface UseMenuRootParameters {
  /**
   * If `true`, the dropdown is initially open.
   */
  defaultOpen?: boolean;
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
  /**
   * The name of the component using useDropdown.
   * For debugging purposes.
   * @default 'useDropdown'
   */
  componentName?: string;
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

export const DropdownActionTypes = {
  blur: 'dropdown:blur',
  escapeKeyDown: 'dropdown:escapeKeyDown',
  toggle: 'dropdown:toggle',
  open: 'dropdown:open',
  close: 'dropdown:close',
} as const;

interface DropdownBlurAction {
  type: typeof DropdownActionTypes.blur;
  event: React.FocusEvent;
}

interface DropdownEscapeKeyDownAction {
  type: typeof DropdownActionTypes.escapeKeyDown;
  event: React.KeyboardEvent;
}

interface DropdownToggleAction {
  type: typeof DropdownActionTypes.toggle;
  event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent | null;
}

interface DropdownOpenAction {
  type: typeof DropdownActionTypes.open;
  event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent | null;
}

interface DropdownCloseAction {
  type: typeof DropdownActionTypes.close;
  event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent | null;
}

export type MenuReducerAction =
  | DropdownBlurAction
  | DropdownEscapeKeyDownAction
  | DropdownToggleAction
  | DropdownOpenAction
  | DropdownCloseAction
  | ListAction<string>;

export type MenuReducerState = ListState<string> & {
  open: boolean;
  changeReason: React.MouseEvent | React.KeyboardEvent | React.FocusEvent | null;
  listboxRef: React.RefObject<HTMLElement>;
};
