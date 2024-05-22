import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { UseDialogCloseParameters, UseDialogCloseReturnValue } from './DialogClose.types';
/**
 *
 * Demos:
 *
 * - [Dialog](https://mui.com/base-ui/react-dialog/#hooks)
 *
 * API:
 *
 * - [useDialogClose API](https://mui.com/base-ui/react-dialog/hooks-api/#use-dialog-close)
 */
export function useDialogClose(params: UseDialogCloseParameters): UseDialogCloseReturnValue {
  const { open, onOpenChange } = params;
  const handleClick = React.useCallback(() => {
    if (open) {
      onOpenChange?.(false);
    }
  }, [open, onOpenChange]);

  const getRootProps = (externalProps: React.HTMLAttributes<any>) =>
    mergeReactProps(externalProps, { onClick: handleClick });

  return {
    getRootProps,
  };
}
