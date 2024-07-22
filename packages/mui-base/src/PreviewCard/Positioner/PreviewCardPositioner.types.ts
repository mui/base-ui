import type * as React from 'react';
import type { Side, Alignment } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';
import type { PreviewCardPositionerParameters } from './usePreviewCardPositioner.types';

export interface PreviewCardPositionerContextValue {
  side: Side;
  alignment: Alignment;
  arrowRef: React.MutableRefObject<Element | null>;
  arrowUncentered: boolean;
  arrowStyles: React.CSSProperties;
}

export type PreviewCardPositionerOwnerState = {
  open: boolean;
  side: Side;
  alignment: Alignment;
};

export interface PreviewCardPositionerProps
  extends PreviewCardPositionerParameters,
    BaseUIComponentProps<'div', PreviewCardPositionerOwnerState> {}
