import * as React from 'react';
import { useForkRef } from '../utils/useForkRef';

export type DialogOpenState = 'closed' | 'open' | 'openModal';

export interface DialogRootProps {
  open?: boolean;
  modal?: boolean;
  children?: React.ReactNode;
  onClosed?: () => void;
}

const defaultRender = (props: React.ComponentPropsWithRef<'dialog'>) => <dialog {...props} />;

const DialogRoot = React.forwardRef(function DialogRoot(
  props: DialogRootProps,
  forwardedRef: React.Ref<HTMLDialogElement>,
) {
  const { open, modal, onClosed, ...other } = props;

  const ref = React.useRef<HTMLDialogElement>(null);
  const handleRef = useForkRef(ref, forwardedRef);

  React.useEffect(() => {
    if (!open) {
      ref.current?.close();
      return;
    }

    if (modal) {
      ref.current?.showModal();
    } else {
      ref.current?.show();
    }
  }, [open, modal]);

  const handleCancel = (event: React.SyntheticEvent) => {
    event.preventDefault();
    onClosed?.();
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    if ((event.target as HTMLFormElement).method === 'dialog') {
      event.preventDefault();
      handleCancel(event);
    }
  };

  const outputProps: React.ComponentPropsWithRef<'dialog'> = {
    ...other,
    onCancel: handleCancel,
    onSubmit: handleFormSubmit,
    ref: handleRef,
  };

  return defaultRender(outputProps);
});

export { DialogRoot };
