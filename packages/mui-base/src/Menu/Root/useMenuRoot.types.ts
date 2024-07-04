import { FloatingRootContext } from '@floating-ui/react';
import { GenericHTMLProps } from '../../utils/types';

export type MenuOrientation = 'horizontal' | 'vertical';
export type MenuDirection = 'ltr' | 'rtl';

export interface UseMenuRootParameters {
  setOpen: (open: boolean, event: Event | undefined) => void;
  open: boolean;
  orientation: MenuOrientation;
  direction: MenuDirection;
  disabled: boolean;
  nested: boolean;
}

export interface UseMenuRootReturnValue {
  triggerElement: HTMLElement | null;
  setTriggerElement: (element: HTMLElement | null) => void;
  setPositionerElement: (element: HTMLElement | null) => void;
  floatingRootContext: FloatingRootContext;
  getTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  getPositionerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  getItemProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  itemDomElements: React.MutableRefObject<(HTMLElement | null)[]>;
  itemLabels: React.MutableRefObject<(string | null)[]>;
  activeIndex: number | null;
}
