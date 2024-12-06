import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { GenericHTMLProps } from '../../utils/types';

export function useTooltipArrow(params: useTooltipArrow.Parameters): useTooltipArrow.ReturnValue {
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

namespace useTooltipArrow {
  export interface Parameters {
    arrowStyles: React.CSSProperties;
  }

  export interface ReturnValue {
    getArrowProps: (props?: GenericHTMLProps) => GenericHTMLProps;
  }
}
