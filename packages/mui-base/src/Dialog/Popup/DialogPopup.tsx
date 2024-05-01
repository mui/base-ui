import * as React from 'react';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { useForkRef } from '../../utils/useForkRef';

export interface DialogPopupProps {
  keepMounted?: boolean;
  children?: React.ReactNode;
}

const DialogPopup = React.forwardRef(function DialogPopup(
  props: DialogPopupProps & React.ComponentPropsWithRef<'dialog'>,
  forwardedRef: React.ForwardedRef<HTMLDialogElement>,
) {
  const { keepMounted, ...other } = props;

  const { open, onOpenChange, modal } = useDialogRootContext();
  const previousOpen = React.useRef<boolean>(open);

  const ref = React.useRef<HTMLDialogElement>(null);
  const handleRef = useForkRef(ref, forwardedRef);

  React.useEffect(() => {
    if (!open) {
      ref.current?.close();
    } else if (modal) {
      if (previousOpen.current === true) {
        ref.current?.close();
      }
      ref.current?.showModal();
    } else {
      if (previousOpen.current === true) {
        ref.current?.close();
      }
      ref.current?.show();
    }

    previousOpen.current = open;
  }, [open, modal]);

  const handleCancel = (event: React.SyntheticEvent) => {
    event.preventDefault();
    onOpenChange?.(false);
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    if ((event.target as HTMLFormElement).method === 'dialog') {
      event.preventDefault();
      onOpenChange?.(false);
    }
  };

  const outputProps: React.ComponentPropsWithRef<'dialog'> = {
    ...other,
    onCancel: handleCancel,
    onSubmit: handleFormSubmit,
    ref: handleRef,
  };

  return <dialog {...outputProps} />;
});

export { DialogPopup };
