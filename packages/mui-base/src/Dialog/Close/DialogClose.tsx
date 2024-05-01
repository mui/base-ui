import * as React from 'react';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { useDialogRootContext } from '../Root/DialogRootContext';

const DialogClose = React.forwardRef(function DialogClose(
  props: React.ComponentPropsWithRef<'button'>,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { open, onOpenChange } = useDialogRootContext();

  const handleClick = React.useCallback(() => {
    if (open) {
      onOpenChange?.(false);
    }
  }, [open, onOpenChange]);

  const rootProps = {
    ...props,
    onClick: handleClick,
    ref: forwardedRef,
  };

  return defaultRenderFunctions.button(rootProps);
});

export { DialogClose };
