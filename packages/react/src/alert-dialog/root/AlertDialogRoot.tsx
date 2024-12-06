'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { DialogRoot } from '../../dialog/root/DialogRoot';
import { AlertDialogRootContext } from './AlertDialogRootContext';
import { useDialogRoot } from '../../dialog/root/useDialogRoot';

/**
 *
 * Demos:
 *
 * - [Alert Dialog](https://base-ui.com/components/react-alert-dialog/)
 *
 * API:
 *
 * - [AlertDialogRoot API](https://base-ui.com/components/react-alert-dialog/#api-reference-AlertDialogRoot)
 */
const AlertDialogRoot: React.FC<AlertDialogRoot.Props> = function AlertDialogRoot(props) {
  const { children, defaultOpen = false, onOpenChange, open } = props;

  const parentDialogRootContext = React.useContext(AlertDialogRootContext);

  const dialogRoot = useDialogRoot({
    open,
    defaultOpen,
    onOpenChange,
    modal: true,
    dismissible: false,
    onNestedDialogClose: parentDialogRootContext?.onNestedDialogClose,
    onNestedDialogOpen: parentDialogRootContext?.onNestedDialogOpen,
  });

  const hasParentDialog = Boolean(parentDialogRootContext);

  const contextValue = React.useMemo(
    () => ({ ...dialogRoot, hasParentDialog }),
    [dialogRoot, hasParentDialog],
  );

  return (
    <AlertDialogRootContext.Provider value={contextValue}>
      {children}
    </AlertDialogRootContext.Provider>
  );
};

namespace AlertDialogRoot {
  export type Props = Omit<DialogRoot.Props, 'modal' | 'dismissible'>;
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
   *
   * @default false
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
