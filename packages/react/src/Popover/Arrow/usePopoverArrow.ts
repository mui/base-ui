import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { GenericHTMLProps } from '../../utils/types';

export function usePopoverArrow(params: usePopoverArrow.Parameters): usePopoverArrow.ReturnValue {
  const { arrowStyles, hidden } = params;

  const getArrowProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'div'>(externalProps, {
        style: {
          ...arrowStyles,
          ...(hidden && { visibility: 'hidden' }),
        },
      });
    },
    [arrowStyles, hidden],
  );

  return React.useMemo(
    () => ({
      getArrowProps,
    }),
    [getArrowProps],
  );
}

namespace usePopoverArrow {
  export interface Parameters {
    arrowStyles: React.CSSProperties;
    hidden?: boolean;
  }
  export interface ReturnValue {
    getArrowProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
