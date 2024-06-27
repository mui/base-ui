import type * as React from 'react';
import type { GenericHTMLProps } from '../../utils/types';

export interface UseHoverCardArrowParameters {
  arrowStyles: React.CSSProperties;
  hidden?: boolean;
}

export interface UseHoverCardArrowReturnValue {
  getArrowProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}
