'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
/**
 *
 * API:
 *
 * - [useSelectBackdrop API](https://mui.com/base-ui/api/use-select-backdrop/)
 */
export function useSelectBackdrop() {
  const getBackdropProps = React.useCallback((externalProps = {}) => {
    return mergeReactProps<'div'>(externalProps, {
      role: 'presentation',
      style: {
        zIndex: 2147483647, // max z-index
        overflow: 'auto',
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
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
