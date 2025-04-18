import * as React from 'react';
import type { FloatingRootContext } from '@floating-ui/react';
import type { OpenChangeReason } from '../../utils/translateOpenChangeReason';
import type { TransitionStatus } from '../../utils';

export interface NavigationMenuRootContext {
  open: boolean;
  setOpen: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  value: any;
  setValue: (value: any) => void;
  transitionStatus: TransitionStatus;
  mounted: boolean;
  popupElement: HTMLElement | null;
  setPopupElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  positionerElement: HTMLElement | null;
  setPositionerElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  viewportElement: HTMLElement | null;
  setViewportElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  currentTriggerElement: HTMLElement | null;
  setCurrentTriggerElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  activationDirection: 'left' | 'right' | null;
  setActivationDirection: React.Dispatch<React.SetStateAction<'left' | 'right' | null>>;
  floatingRootContext: FloatingRootContext | undefined;
  setFloatingRootContext: React.Dispatch<React.SetStateAction<FloatingRootContext | undefined>>;
  currentContentRef: React.RefObject<HTMLDivElement | null>;
}

export const NavigationMenuRootContext = React.createContext<NavigationMenuRootContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  NavigationMenuRootContext.displayName = 'NavigationMenuRootContext';
}

function useNavigationMenuRootContext(optional?: false): NavigationMenuRootContext;
function useNavigationMenuRootContext(optional: true): NavigationMenuRootContext | undefined;
function useNavigationMenuRootContext(optional?: boolean) {
  const context = React.useContext(NavigationMenuRootContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: NavigationMenuRootContext is missing. Navigation Menu parts must be placed within <NavigationMenu.Root>.',
    );
  }

  return context;
}

export { useNavigationMenuRootContext };
