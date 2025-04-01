import * as React from 'react';

export interface MenubarRootContext {}

export const MenubarRootContext = React.createContext<MenubarRootContext | null>(null);

export const useMenubarRootContext = () => {
  const context = React.useContext(MenubarRootContext);
  return context;
};
