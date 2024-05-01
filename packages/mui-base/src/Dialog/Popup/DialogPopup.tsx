import * as React from 'react';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { useForkRef } from '../../utils/useForkRef';
import { useId } from '../../utils/useId';

export interface DialogPopupProps {
  keepMounted?: boolean;
  children?: React.ReactNode;
}

const DialogPopup = React.forwardRef(function DialogPopup(
  props: DialogPopupProps & React.ComponentPropsWithRef<'dialog'>,
  forwardedRef: React.ForwardedRef<HTMLDialogElement>,
) {
  const { keepMounted, id: idProp, ...other } = props;

  const { open, onOpenChange, modal, titleElementId, descriptionElementId, registerPopup, type } =
    useDialogRootContext();

  const id = useId(idProp);

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

  React.useEffect(() => {
    registerPopup(id ?? null);
    return () => {
      registerPopup(null);
    };
  });

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
    'aria-labelledby': titleElementId ?? undefined,
    'aria-describedby': descriptionElementId ?? undefined,
    role: type === 'alertdialog' ? 'alertdialog' : undefined,
    ...other,
    id,
    onCancel: handleCancel,
    onSubmit: handleFormSubmit,
    ref: handleRef,
  };

  return <dialog {...outputProps} />;
});

export { DialogPopup };
