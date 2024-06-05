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

  const getRootProps = React.useCallback(
    (externalProps: React.HTMLAttributes<any> = {}) =>
      mergeReactProps(externalProps, {
        onClick: () => {
          if (!open) {
            onOpenChange?.(true);
          }
        },
        'aria-haspopup': 'dialog',
        'aria-controls': popupElementId ?? undefined,
      }),
    [open, onOpenChange, popupElementId],
  );

  return React.useMemo(() => ({
    getRootProps,
  }), [getRootProps]);
}
