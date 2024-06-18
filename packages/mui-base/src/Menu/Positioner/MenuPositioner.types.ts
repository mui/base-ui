import type { Side, VirtualElement } from '@floating-ui/react';
import { BaseUIComponentProps } from '../../utils/types';

export interface MenuPositionerProps extends BaseUIComponentProps<'div', MenuPositionerOwnerState> {
  anchor?:
    | Element
    | null
    | VirtualElement
    | React.MutableRefObject<Element | null>
    | (() => Element | VirtualElement | null);
  children?: React.ReactNode;
  side?: Side;
  alignment?: 'start' | 'end' | 'center';
  keepMounted?: boolean;
}

export interface MenuPositionerOwnerState {
  open: boolean;
}
