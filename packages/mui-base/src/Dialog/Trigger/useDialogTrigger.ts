import * as React from 'react';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { UseDialogTriggerReturnValue } from './DialogTrigger.types';

export function useDialogTrigger(): UseDialogTriggerReturnValue {
  const { open, onOpenChange, modal, type, popupElementId } = useDialogRootContext();

  const handleClick = React.useCallback(() => {
    if (!open) {
      onOpenChange?.(true);
    }
  }, [open, onOpenChange]);

  const getRootProps = React.useCallback(
    (otherProps: React.HTMLAttributes<any> = {}) =>
      mergeReactProps(otherProps, {
        onClick: handleClick,
        'aria-haspopup': 'dialog',
        'aria-controls': popupElementId ?? undefined,
      }),
    [handleClick, popupElementId],
  );

  return {
    getRootProps,
    open,
    type,
    modal,
  };
}
