'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { MAX_Z_INDEX } from '../../utils/constants';

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
        zIndex: MAX_Z_INDEX,
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
