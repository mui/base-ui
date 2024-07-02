'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { UsePopoverBackdropReturnValue } from './usePopoverBackdrop.types';

/**
 *
 * API:
 *
 * - [usePopoverBackdrop API](https://mui.com/base-ui/api/use-popover-backdrop/)
 */
export function usePopoverBackdrop(): UsePopoverBackdropReturnValue {
  const getBackdropProps = React.useCallback((externalProps = {}) => {
    return mergeReactProps<'div'>(externalProps, {
      role: 'presentation',
      style: {
        zIndex: 2147483647, // max z-index
        overflow: 'auto',
        position: 'fixed',
        inset: 0,
      },
    });
  }, []);

  return React.useMemo(
    () => ({
      getBackdropProps,
    }),
    [getBackdropProps],
  );
}
