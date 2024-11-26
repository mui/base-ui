import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';

export function usePreviewCardArrow(
  params: usePreviewCardArrow.Parameters,
): usePreviewCardArrow.ReturnValue {
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

namespace usePreviewCardArrow {
  export interface Parameters {
    arrowStyles: React.CSSProperties;
    hidden?: boolean;
  }

  export interface ReturnValue {
    getArrowProps: (
      externalProps?: React.HTMLAttributes<HTMLDivElement>,
    ) => React.HTMLAttributes<HTMLDivElement>;
  }
}
