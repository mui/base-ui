import * as React from 'react';
import PropTypes from 'prop-types';
import { useForkRef } from '../../utils/useForkRef';
import { DialogRootProps } from './DialogRoot.types';

const defaultRender = (props: React.ComponentPropsWithRef<'dialog'>) => <dialog {...props} />;

const DialogRoot = React.forwardRef(function DialogRoot(
  props: DialogRootProps & React.ComponentPropsWithoutRef<'dialog'>,
  forwardedRef: React.Ref<HTMLDialogElement>,
) {
  const { open = false, modal = true, onOpenChange, ...other } = props;
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

  return defaultRender(outputProps);
});

DialogRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * @ignore
   */
  modal: PropTypes.bool,
  /**
   * @ignore
   */
  onOpenChange: PropTypes.func,
  /**
   * @ignore
   */
  open: PropTypes.bool,
} as any;

export { DialogRoot };
