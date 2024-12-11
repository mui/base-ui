'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { DialogRootContext } from './DialogRootContext';
import { type CommonParameters, useDialogRoot } from './useDialogRoot';
import { PortalContext } from '../../portal/PortalContext';

/**
 * Groups all parts of the dialog.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
const DialogRoot = function DialogRoot(props: DialogRoot.Props) {
  const {
    children,
    defaultOpen = false,
    dismissible = true,
    modal = true,
    onOpenChange,
    open,
  } = props;

  const parentDialogRootContext = React.useContext(DialogRootContext);

  const dialogRoot = useDialogRoot({
    open,
    defaultOpen,
    onOpenChange,
    modal,
    dismissible,
    onNestedDialogClose: parentDialogRootContext?.onNestedDialogClose,
    onNestedDialogOpen: parentDialogRootContext?.onNestedDialogOpen,
  });

  const hasParentDialog = Boolean(parentDialogRootContext);

  const contextValue = React.useMemo(
    () => ({ ...dialogRoot, hasParentDialog, dismissible }),
    [dialogRoot, hasParentDialog, dismissible],
  );

  return (
    <DialogRootContext.Provider value={contextValue}>
      <PortalContext.Provider value={dialogRoot.mounted}>{children}</PortalContext.Provider>
    </DialogRootContext.Provider>
  );
};

namespace DialogRoot {
  export interface Props extends CommonParameters {
    children?: React.ReactNode;
  }
}

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
   * Whether the dialog is initially open.
   * To render a controlled dialog, use the `open` prop instead.
   * @default false
   */
  defaultOpen: PropTypes.bool,
  /**
   * Determines whether the dialog should close when clicking outside of it.
   * @default true
   */
  dismissible: PropTypes.bool,
  /**
   * Determines whether the dialog is modal.
   * @default true
   */
  modal: PropTypes.bool,
  /**
   * Callback invoked when the dialog is being opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Determines whether the dialog is open.
   */
  open: PropTypes.bool,
} as any;

export { DialogRoot };
