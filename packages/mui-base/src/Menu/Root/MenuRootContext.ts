import * as React from 'react';
import { FloatingRootContext } from '@floating-ui/react';
import { MenuReducerAction, MenuReducerState } from './useMenuRoot.types';
import { GenericHTMLProps } from '../../utils/types';

export interface MenuRootContext {
  dispatch: React.Dispatch<MenuReducerAction>;
  state: MenuReducerState;
  floatingRootContext: FloatingRootContext;
  parentContext: MenuRootContext | null;
  topmostContext: MenuRootContext | null;
  getTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  getPositionerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}

export const MenuRootContext = React.createContext<MenuRootContext | null>(null);

function useMenuRootContext(optional?: false): MenuRootContext;
function useMenuRootContext(optional: true): MenuRootContext | null;
function useMenuRootContext(optional?: boolean) {
  const context = React.useContext(MenuRootContext);
  if (context === null && !optional) {
    throw new Error('Base UI: MenuRootContext is not defined.');
  }

  return context;
}

export { useMenuRootContext };
