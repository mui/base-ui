import type * as React from 'react';
import type { Side } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';
import type { PreviewCardPositionerParameters } from './usePreviewCardPositioner.types';

export interface PreviewCardPositionerContextValue {
  side: Side;
  alignment: 'start' | 'end' | 'center';
  arrowRef: React.MutableRefObject<Element | null>;
  arrowUncentered: boolean;
  arrowStyles: React.CSSProperties;
}

export type PreviewCardPositionerOwnerState = {
  open: boolean;
  side: Side;
  alignment: 'start' | 'center' | 'end';
};

export interface PreviewCardPositionerProps
  extends PreviewCardPositionerParameters,
    BaseUIComponentProps<'div', PreviewCardPositionerOwnerState> {}
