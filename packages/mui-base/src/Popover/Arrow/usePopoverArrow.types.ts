import type * as React from 'react';
import type { GenericHTMLProps } from '../../utils/types';

export interface UsePopoverArrowParameters {
  arrowStyles: React.CSSProperties;
  hidden?: boolean;
}

export interface UsePopoverArrowReturnValue {
  getArrowProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}
