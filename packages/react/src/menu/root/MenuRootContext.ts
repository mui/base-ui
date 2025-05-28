'use client';
import * as React from 'react';
import type { FloatingRootContext } from '@floating-ui/react';
import type { MenuParent, MenuRoot } from './MenuRoot';
import { HTMLProps } from '../../utils/types';
import { TransitionStatus } from '../../utils';

export interface MenuRootContext {
  disabled: boolean;
  typingRef: React.RefObject<boolean>;
  modal: boolean;
  activeIndex: number | null;
  floatingRootContext: FloatingRootContext;
  itemProps: HTMLProps;
  popupProps: HTMLProps;
  triggerProps: HTMLProps;
  listRef: React.MutableRefObject<(HTMLElement | null)[]>;
  itemLabels: React.MutableRefObject<(string | null)[]>;
  mounted: boolean;
  open: boolean;
  popupRef: React.RefObject<HTMLElement | null>;
  setOpen: (
    open: boolean,
    event: Event | undefined,
    reason: MenuRoot.OpenChangeReason | undefined,
  ) => void;
  positionerRef: React.RefObject<HTMLElement | null>;
  setPositionerElement: (element: HTMLElement | null) => void;
  setTriggerElement: (element: HTMLElement | null) => void;
  transitionStatus: TransitionStatus;
  allowMouseUpTriggerRef: React.RefObject<boolean>;
  lastOpenChangeReason: MenuRoot.OpenChangeReason | null;
  instantType: 'dismiss' | 'click' | 'group' | undefined;
  onOpenChangeComplete: ((open: boolean) => void) | undefined;
  setHoverEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveIndex: React.Dispatch<React.SetStateAction<number | null>>;
  parent: MenuParent;
}

export const MenuRootContext = React.createContext<MenuRootContext | undefined>(undefined);

export function useMenuRootContext(optional?: false): MenuRootContext;
export function useMenuRootContext(optional: true): MenuRootContext | undefined;
export function useMenuRootContext(optional?: boolean) {
  const context = React.useContext(MenuRootContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: MenuRootContext is missing. Menu parts must be placed within <Menu.Root>.',
    );
  }

  return context;
}
