import * as React from 'react';
import { useDialogRootContext } from '../Root/DialogRootContext';

const DialogBackdrop = React.forwardRef(function DialogBackdrop(
  props: React.ComponentPropsWithoutRef<'div'>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { open, onOpenChange } = useDialogRootContext();

  const handleMouseDown = React.useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onOpenChange?.(false);
      }
    },
    [onOpenChange],
  );

  if (!open) {
    return null;
  }

  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
  return <div {...props} ref={forwardedRef} onMouseDown={handleMouseDown} />;
});

export { DialogBackdrop };
