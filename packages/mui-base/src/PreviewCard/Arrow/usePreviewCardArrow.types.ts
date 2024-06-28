import type * as React from 'react';
import type { GenericHTMLProps } from '../../utils/types';

export interface UsePreviewCardArrowParameters {
  arrowStyles: React.CSSProperties;
  hidden?: boolean;
}

export interface UsePreviewCardArrowReturnValue {
  getArrowProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}
