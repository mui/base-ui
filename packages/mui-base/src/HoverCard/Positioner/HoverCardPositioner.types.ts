import type * as React from 'react';
import type { Side } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';
import type { HoverCardPositionerParameters } from './useHoverCardPositioner.types';

export interface HoverCardPositionerContextValue {
  side: Side;
  alignment: 'start' | 'end' | 'center';
  arrowRef: React.MutableRefObject<Element | null>;
  arrowUncentered: boolean;
  arrowStyles: React.CSSProperties;
}

export type HoverCardPositionerOwnerState = {
  open: boolean;
  side: Side;
  alignment: 'start' | 'center' | 'end';
};

export interface HoverCardPositionerProps
  extends HoverCardPositionerParameters,
    BaseUIComponentProps<'div', HoverCardPositionerOwnerState> {}
