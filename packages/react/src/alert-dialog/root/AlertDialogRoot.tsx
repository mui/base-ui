'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { DialogRoot } from '../../dialog/root/DialogRoot';
import { AlertDialogRootContext } from './AlertDialogRootContext';
import { useDialogRoot } from '../../dialog/root/useDialogRoot';
import { PortalContext } from '../../portal/PortalContext';

/**
 * Groups all parts of the alert dialog.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
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
      <PortalContext.Provider value={dialogRoot.mounted}>{children}</PortalContext.Provider>
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
   * Whether the dialog is initially open.
   * To render a controlled dialog, use the `open` prop instead.
   * @default false
   */
  defaultOpen: PropTypes.bool,
  /**
   * Callback invoked when the dialog is being opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Whether the dialog is currently open.
   */
  open: PropTypes.bool,
} as any;

export { AlertDialogRoot };
