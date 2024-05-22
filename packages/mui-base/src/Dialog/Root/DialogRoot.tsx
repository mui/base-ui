import * as React from 'react';
import PropTypes from 'prop-types';
import { DialogRootProps } from './DialogRoot.types';
import { DialogRootContext } from './DialogRootContext';
import { useDialogRoot } from './useDialogRoot';

const DialogRoot = function DialogRoot(props: DialogRootProps) {
  const {
    children,
    defaultOpen,
    modal = true,
    onOpenChange,
    open: openProp,
    softClose,
    type = 'dialog',
  } = props;

  const dialogRootContext = React.useContext(DialogRootContext);

  const dialogRoot = useDialogRoot({
    open: openProp,
    defaultOpen,
    onOpenChange,
    type,
    modal,
    softClose,
    onNestedDialogClose: dialogRootContext?.onNestedDialogClose,
    onNestedDialogOpen: dialogRootContext?.onNestedDialogOpen,
  });

  const hasParentDialog = Boolean(dialogRootContext);

  const contextValue = React.useMemo(
    () => ({ ...dialogRoot, hasParentDialog }),
    [dialogRoot, hasParentDialog],
  );

  return <DialogRootContext.Provider value={contextValue}>{children}</DialogRootContext.Provider>;
};

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
   * Determines whether the dialog is initally open.
   * This is an uncontrolled equivalent of the `open` prop.
   */
  defaultOpen: PropTypes.bool,
  /**
   * Determines whether the dialog is modal.
   * @default true
   */
  modal: PropTypes.bool,
  /**
   * @ignore
   */
  onNestedDialogClose: PropTypes.func,
  /**
   * @ignore
   */
  onNestedDialogOpen: PropTypes.func,
  /**
   * Callback invoked when the dialog is being opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Determines whether the dialog is open.
   */
  open: PropTypes.bool,
  /**
   * Determines whether the dialog should close when clicking outside of it or pressing the escape key.
   * @default false
   */
  softClose: PropTypes.oneOfType([PropTypes.oneOf(['clickOutside', 'escapeKey']), PropTypes.bool]),
  /**
   * The type of the dialog - either 'dialog' or 'alertdialog'.
   * @default 'dialog'
   */
  type: PropTypes.oneOf(['alertdialog', 'dialog']),
} as any;

export { DialogRoot };
