import type { FloatingContext, Side } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';
import type { PopoverPositionerParameters } from './usePopoverPositioner.types';

export interface PopoverPositionerContextValue {
  side: Side;
  alignment: 'start' | 'end' | 'center';
  arrowRef: React.MutableRefObject<Element | null>;
  arrowUncentered: boolean;
  floatingContext: FloatingContext;
}

export type PopoverPositionerOwnerState = {
  open: boolean;
  side: Side;
  alignment: 'start' | 'end' | 'center';
};

export interface PopoverPositionerProps
  extends PopoverPositionerParameters,
    BaseUIComponentProps<'div', PopoverPositionerOwnerState> {}
