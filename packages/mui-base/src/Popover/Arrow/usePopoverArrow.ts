'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type {
  UsePopoverArrowParameters,
  UsePopoverArrowReturnValue,
} from './usePopoverArrow.types';

/**
 *
 * API:
 *
 * - [usePopoverArrow API](https://mui.com/base-ui/api/use-popover-arrow/)
 */
export function usePopoverArrow(params: UsePopoverArrowParameters): UsePopoverArrowReturnValue {
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
