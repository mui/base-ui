import type * as React from 'react';
import type { GenericHTMLProps } from '../../utils/types';

export interface UseTooltipArrowParameters {
  arrowStyles: React.CSSProperties;
  hidden?: boolean;
}

export interface UseTooltipArrowReturnValue {
  getArrowProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}
