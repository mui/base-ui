import * as React from 'react';
import { useMenubarRoot } from './useMenubarRoot';

export interface MenubarRootContext extends useMenubarRoot.ReturnValue {}

export const MenubarRootContext = React.createContext<MenubarRootContext | null>(null);

export function useMenubarRootContext(optional?: false): MenubarRootContext;
export function useMenubarRootContext(optional: true): MenubarRootContext | null;
export function useMenubarRootContext(optional?: boolean) {
  const context = React.useContext(MenubarRootContext);
  if (context === null && !optional) {
    throw new Error(
      'Base UI: MenubarRootContext is missing. Menubar parts must be placed within <Menubar.Root>.',
    );
  }

  return context;
}
