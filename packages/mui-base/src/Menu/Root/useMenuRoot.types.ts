import { FloatingRootContext } from '@floating-ui/react';
import { GenericHTMLProps } from '../../utils/types';
import { MenuReducerAction, MenuReducerState } from './menuReducer';

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
