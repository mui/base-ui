import * as React from 'react';
import PropTypes from 'prop-types';
import { AlertDialogRootProps } from './AlertDialogRoot.types';
import { AlertDialogRootContext } from './AlertDialogRootContext';
import { useDialogRoot } from '../../Dialog/Root/useDialogRoot';

function AlertDialogRoot(props: AlertDialogRootProps) {
  const { children, defaultOpen, onOpenChange, open: openProp } = props;

  const dialogRootContext = React.useContext(AlertDialogRootContext);

  const dialogRoot = useDialogRoot({
    open: openProp,
    defaultOpen,
    onOpenChange,
    modal: true,
    onNestedDialogClose: dialogRootContext?.onNestedDialogClose,
    onNestedDialogOpen: dialogRootContext?.onNestedDialogOpen,
  });

  const hasParentDialog = Boolean(dialogRootContext);

  const contextValue = React.useMemo(
    () => ({ ...dialogRoot, hasParentDialog }),
    [dialogRoot, hasParentDialog],
  );

  return (
    <AlertDialogRootContext.Provider value={contextValue}>
      {children}
    </AlertDialogRootContext.Provider>
  );
}

AlertDialogRoot.propTypes /* remove-proptypes */ = {
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
   * Callback invoked when the dialog is being opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Determines whether the dialog is open.
   */
  open: PropTypes.bool,
} as any;

export { AlertDialogRoot };
