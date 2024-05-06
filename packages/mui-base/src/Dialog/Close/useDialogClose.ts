import * as React from 'react';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { UseDialogCloseReturnValue } from './DialogClose.types';
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
export function useDialogClose(): UseDialogCloseReturnValue {
  const { open, onOpenChange, modal, type } = useDialogRootContext();

  const handleClick = React.useCallback(() => {
    if (open) {
      onOpenChange?.(false);
    }
  }, [open, onOpenChange]);

  const getRootProps = (otherProps: React.HTMLAttributes<any>) =>
    mergeReactProps(otherProps, { onClick: handleClick });

  return {
    getRootProps,
    open,
    type,
    modal,
  };
}
