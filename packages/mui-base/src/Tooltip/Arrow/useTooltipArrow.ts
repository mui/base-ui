'use client';

import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type {
  UseTooltipArrowParameters,
  UseTooltipArrowReturnValue,
} from './useTooltipArrow.types';

/**
 *
 * API:
 *
 * - [useTooltipArrow API](https://mui.com/base-ui/api/use-tooltip-arrow/)
 */
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
