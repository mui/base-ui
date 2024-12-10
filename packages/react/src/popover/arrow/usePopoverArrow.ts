import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { GenericHTMLProps } from '../../utils/types';

export function usePopoverArrow(params: usePopoverArrow.Parameters): usePopoverArrow.ReturnValue {
  const { arrowStyles } = params;

  const getArrowProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'div'>(externalProps, {
        style: arrowStyles,
      });
    },
    [arrowStyles],
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
  }

  export interface ReturnValue {
    getArrowProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
