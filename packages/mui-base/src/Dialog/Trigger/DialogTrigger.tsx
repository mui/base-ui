import * as React from 'react';
import { useDialogRootContext } from '../Root/DialogRootContext';

interface DialogTriggerProps {
  children: React.ReactElement;
}

function DialogTrigger(props: DialogTriggerProps) {
  const { children } = props;

  const { open, onOpenChange, popupElementId } = useDialogRootContext();

  const handleClick = () => {
    if (!open) {
      onOpenChange?.(true);
    }
  };

  const newProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
    onClick: handleClick,
    'aria-haspopup': 'dialog',
    'aria-controls': popupElementId ?? undefined,
  };

  return React.cloneElement(children, newProps);
}

export { DialogTrigger };
