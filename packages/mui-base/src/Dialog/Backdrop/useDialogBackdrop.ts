import * as React from 'react';
import type { UseDialogBackdropParams, UseDialogBackdropReturnValue } from './DialogBackdrop.types';
import { useTransitionedElement } from '../../Transitions';
import { mergeReactProps } from '../../utils/mergeReactProps';
/**
 *
 * API:
 *
 * - [useDialogBackdrop API](https://mui.com/base-ui/api/use-dialog-backdrop/)
 */
export function useDialogBackdrop(params: UseDialogBackdropParams): UseDialogBackdropReturnValue {
  const { animated, open } = params;

  const {
    getRootProps: getTransitionProps,
    openState,
    mounted,
  } = useTransitionedElement({ isRendered: open, enabled: animated });

  const getRootProps = React.useCallback(
    (externalProps: React.ComponentPropsWithRef<any>) =>
      mergeReactProps(
        externalProps,
        getTransitionProps({
          role: 'presentation',
        }),
      ),
    [getTransitionProps],
  );

  return {
    getRootProps,
    openState,
    mounted,
  };
}
