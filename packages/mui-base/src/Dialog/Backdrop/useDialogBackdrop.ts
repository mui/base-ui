import * as React from 'react';
import type { UseDialogBackdropParams, UseDialogBackdropReturnValue } from './DialogBackdrop.types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useAnimatedElement } from '../../utils/useAnimatedElement';
import { useForkRef } from '../../utils/useForkRef';

/**
 *
 * API:
 *
 * - [useDialogBackdrop API](https://mui.com/base-ui/api/use-dialog-backdrop/)
 */
export function useDialogBackdrop(params: UseDialogBackdropParams): UseDialogBackdropReturnValue {
  const { animated, open, ref } = params;

  const backdropRef = React.useRef<HTMLElement | null>(null);
  const handleRef = useForkRef(ref, backdropRef);

  const { mounted, transitionStatus } = useAnimatedElement({
    open,
    ref: backdropRef,
    enabled: animated,
  });

  const getRootProps = React.useCallback(
    (externalProps: React.ComponentPropsWithRef<any>) =>
      mergeReactProps(externalProps, {
        role: 'presentation',
        ref: handleRef,
      }),
    [handleRef],
  );

  return {
    getRootProps,
    mounted,
    transitionStatus,
  };
}
