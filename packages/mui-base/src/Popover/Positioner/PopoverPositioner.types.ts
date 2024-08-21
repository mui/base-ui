import type * as React from 'react';
import type { Side, Alignment } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';
import type { PopoverPositionerParameters } from './usePopoverPositioner.types';

export interface PopoverPositionerContextValue {
  side: Side;
  alignment: Alignment;
  arrowRef: React.MutableRefObject<Element | null>;
  arrowUncentered: boolean;
  arrowStyles: React.CSSProperties;
}

export type PopoverPositionerOwnerState = {
  open: boolean;
  side: Side;
  alignment: Alignment;
};

export interface PopoverPositionerProps
  extends PopoverPositionerParameters,
    BaseUIComponentProps<'div', PopoverPositionerOwnerState> {
  /**
   * The container element to which the popover positioner is appended to.
   */
  container?: HTMLElement | null | React.MutableRefObject<HTMLElement | null>;
}
