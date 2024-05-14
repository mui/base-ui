import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type {
  UseDialogTriggerParameters,
  UseDialogTriggerReturnValue,
} from './DialogTrigger.types';
/**
 *
 * Demos:
 *
 * - [Dialog](https://mui.com/base-ui/react-dialog/#hooks)
 *
 * API:
 *
 * - [useDialogTrigger API](https://mui.com/base-ui/react-dialog/hooks-api/#use-dialog-trigger)
 */
export function useDialogTrigger(params: UseDialogTriggerParameters): UseDialogTriggerReturnValue {
  const { open, onOpenChange, popupElementId } = params;
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
  };
}
