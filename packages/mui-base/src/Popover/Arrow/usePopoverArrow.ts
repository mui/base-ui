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
  const { floatingContext, hidden } = params;
  const middlewareData = floatingContext.middlewareData;

  const getArrowProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'div'>(externalProps, {
        style: {
          position: 'absolute',
          top: middlewareData.arrow?.y,
          left: middlewareData.arrow?.x,
          visibility: hidden ? 'hidden' : 'visible',
        },
      });
    },
    [middlewareData, hidden],
  );

  return React.useMemo(
    () => ({
      getArrowProps,
    }),
    [getArrowProps],
  );
}
