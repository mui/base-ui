import * as React from 'react';
import PropTypes from 'prop-types';
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

DialogTrigger.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.element.isRequired,
} as any;

export { DialogTrigger };
