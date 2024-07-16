import * as React from 'react';
import { FloatingRootContext } from '@floating-ui/react';
import { GenericHTMLProps } from '../../utils/types';

export interface MenuRootContext {
  floatingRootContext: FloatingRootContext;
  getTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  getPositionerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  getItemProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  triggerElement: HTMLElement | null;
  setTriggerElement: (element: HTMLElement | null) => void;
  setPositionerElement: (element: HTMLElement | null) => void;
  popupRef: React.RefObject<HTMLElement | null>;
  nested: boolean;
  parentContext: MenuRootContext | null;
  activeIndex: number | null;
  itemDomElements: React.MutableRefObject<(HTMLElement | null)[]>;
  itemLabels: React.MutableRefObject<(string | null)[]>;
  open: boolean;
  setOpen: (open: boolean, event: Event | undefined) => void;
  disabled: boolean;
  clickAndDragEnabled: boolean;
  setClickAndDragEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  mounted: boolean;
  transitionStatus: 'entering' | 'exiting' | undefined;
}

export const MenuRootContext = React.createContext<MenuRootContext | null>(null);

MenuRootContext.displayName = 'MenuRootContext';

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
