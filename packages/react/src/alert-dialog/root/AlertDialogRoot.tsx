'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { DialogRoot } from '../../dialog/root/DialogRoot';
import { AlertDialogRootContext } from './AlertDialogRootContext';
import { useDialogRoot } from '../../dialog/root/useDialogRoot';

/**
 * Groups all parts of the alert dialog.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
const AlertDialogRoot: React.FC<AlertDialogRoot.Props> = function AlertDialogRoot(props) {
  const {
    children,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    open,
    actionsRef,
  } = props;

  const parentDialogRootContext = React.useContext(AlertDialogRootContext);

  const dialogRoot = useDialogRoot({
    open,
    defaultOpen,
    onOpenChange,
    actionsRef,
    onOpenChangeComplete,
    modal: true,
    dismissible: false,
    onNestedDialogClose: parentDialogRootContext?.onNestedDialogClose,
    onNestedDialogOpen: parentDialogRootContext?.onNestedDialogOpen,
  });

  const nested = Boolean(parentDialogRootContext);

  const contextValue: AlertDialogRootContext = React.useMemo(
    () => ({
      ...dialogRoot,
      nested,
      onOpenChangeComplete,
    }),
    [dialogRoot, nested, onOpenChangeComplete],
  );

  return (
    <AlertDialogRootContext.Provider value={contextValue}>
      {children}
    </AlertDialogRootContext.Provider>
  );
};

namespace AlertDialogRoot {
  export interface Props extends Omit<DialogRoot.Props, 'modal' | 'dismissible'> {}

  export type Actions = DialogRoot.Actions;
}

AlertDialogRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the dialog will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the dialog manually.
   * Useful when the dialog's animation is controlled by an external library.
   */
  actionsRef: PropTypes.shape({
    current: PropTypes.shape({
      unmount: PropTypes.func.isRequired,
    }).isRequired,
  }),
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Whether the dialog is initially open.
   *
   * To render a controlled dialog, use the `open` prop instead.
   * @default false
   */
  defaultOpen: PropTypes.bool,
  /**
   * Event handler called when the dialog is opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Event handler called after any animations complete when the dialog is opened or closed.
   */
  onOpenChangeComplete: PropTypes.func,
  /**
   * Whether the dialog is currently open.
   */
  open: PropTypes.bool,
} as any;

export { AlertDialogRoot };
