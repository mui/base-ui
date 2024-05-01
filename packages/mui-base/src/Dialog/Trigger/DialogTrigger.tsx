import * as React from 'react';
import { useDialogRootContext } from '../Root/DialogRootContext';

interface DialogTriggerProps {
  children: React.ReactElement;
}

function DialogTrigger(props: DialogTriggerProps) {
  const { children } = props;

  const { open, onOpenChange } = useDialogRootContext();

  const handleClick = () => {
    if (!open) {
      onOpenChange?.(true);
    }
  };

  return React.cloneElement(children, { onClick: handleClick });
}

export { DialogTrigger };
