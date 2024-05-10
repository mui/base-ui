import * as React from 'react';
import type { UseDialogBackdropParams, UseDialogBackdropReturnValue } from './DialogBackdrop.types';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { useTransitionedElement } from '../../Transitions';
import { mergeReactProps } from '../../utils/mergeReactProps';

export function useDialogBackdrop(params: UseDialogBackdropParams): UseDialogBackdropReturnValue {
  const { animated } = params;
  const { open, modal } = useDialogRootContext();

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
    open,
    openState,
    mounted,
    modal,
  };
}
