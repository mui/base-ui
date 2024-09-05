'use client';

import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type {
  UseTooltipArrowParameters,
  UseTooltipArrowReturnValue,
} from './useTooltipArrow.types';

export function useTooltipArrow(params: UseTooltipArrowParameters): UseTooltipArrowReturnValue {
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
