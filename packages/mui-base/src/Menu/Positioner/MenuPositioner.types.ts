import type { FloatingContext, Side } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';
import type { MenuPositionerParameters } from './useMenuPositioner.types';

export interface MenuPositionerContextValue {
  side: Side;
  alignment: 'start' | 'end' | 'center';
  arrowRef: React.MutableRefObject<Element | null>;
  arrowUncentered: boolean;
  floatingContext: FloatingContext;
}

export type MenuPositionerOwnerState = {
  open: boolean;
  side: Side;
  alignment: 'start' | 'end' | 'center';
};

export interface MenuPositionerProps
  extends MenuPositionerParameters,
    BaseUIComponentProps<'div', MenuPositionerOwnerState> {}
