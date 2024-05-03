import * as React from 'react';
import { useDialogRootContext } from '../Root/DialogRootContext';

const DialogBackdrop = React.forwardRef(function DialogBackdrop(
  props: React.ComponentPropsWithoutRef<'div'>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { open, modal } = useDialogRootContext();

  if (!open) {
    return null;
  }

  return <div {...props} data-modal={modal || undefined} ref={forwardedRef} />;
});

export { DialogBackdrop };
