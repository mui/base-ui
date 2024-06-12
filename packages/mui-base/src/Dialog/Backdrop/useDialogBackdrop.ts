import * as React from 'react';
import type { UseDialogBackdropParams, UseDialogBackdropReturnValue } from './DialogBackdrop.types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useAnimatedElement } from '../../utils/useAnimatedElement';
import { useForkRef } from '../../utils/useForkRef';
import { useEventCallback } from '../../utils/useEventCallback';

/**
 *
 * API:
 *
 * - [useDialogBackdrop API](https://mui.com/base-ui/api/use-dialog-backdrop/)
 */
export function useDialogBackdrop(params: UseDialogBackdropParams): UseDialogBackdropReturnValue {
  const { animated, open, ref, onMount: onMountParam, onUnmount: onUnmountParam } = params;

  const backdropRef = React.useRef<HTMLElement | null>(null);
  const handleRef = useForkRef(ref, backdropRef);

  const { mounted, transitionStatus } = useAnimatedElement({
    open,
    ref: backdropRef,
    enabled: animated,
  });

  const onMount = useEventCallback(onMountParam);
  const onUnmount = useEventCallback(onUnmountParam);

  React.useEffect(() => {
    onMount();

    return onUnmount;
  }, [onMount, onUnmount]);

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
