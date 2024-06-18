import type { FloatingContext } from '@floating-ui/react';
import type { GenericHTMLProps } from '../../utils/types';

export interface UsePopoverArrowParameters {
  floatingContext: FloatingContext;
  hidden?: boolean;
}

export interface UsePopoverArrowReturnValue {
  getArrowProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}
