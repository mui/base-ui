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
  const { open } = params;

  const ref = React.useRef<HTMLElement | null>(null);

  const { getRootProps: getTransitionProps, mounted } = useTransitionedElement({
    isRendered: open,
    elementRef: ref,
  });

  const getRootProps = React.useCallback(
    (externalProps: React.ComponentPropsWithRef<any>) =>
      mergeReactProps(
        externalProps,
        getTransitionProps({
          role: 'presentation',
          ref,
        }),
      ),
    [getTransitionProps],
  );

  return {
    getRootProps,
    mounted,
  };
}
