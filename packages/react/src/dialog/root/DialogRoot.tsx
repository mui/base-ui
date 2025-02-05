'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { DialogRootContext, useOptionalDialogRootContext } from './DialogRootContext';
import { DialogContext } from '../utils/DialogContext';
import { type SharedParameters, useDialogRoot } from './useDialogRoot';

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
    action,
    onOpenChangeComplete,
  } = props;

  const parentDialogRootContext = useOptionalDialogRootContext();

  const dialogRoot = useDialogRoot({
    open,
    defaultOpen,
    onOpenChange,
    modal,
    dismissible,
    action,
    onOpenChangeComplete,
    onNestedDialogClose: parentDialogRootContext?.onNestedDialogClose,
    onNestedDialogOpen: parentDialogRootContext?.onNestedDialogOpen,
  });

  const nested = Boolean(parentDialogRootContext);

  const dialogContextValue = React.useMemo(
    () => ({
      ...dialogRoot,
      nested,
      onOpenChangeComplete,
    }),
    [dialogRoot, nested, onOpenChangeComplete],
  );
  const dialogRootContextValue = React.useMemo(() => ({ dismissible }), [dismissible]);

  return (
    <DialogContext.Provider value={dialogContextValue}>
      <DialogRootContext.Provider value={dialogRootContextValue}>
        {children}
      </DialogRootContext.Provider>
    </DialogContext.Provider>
  );
};

namespace DialogRoot {
  export interface Props extends SharedParameters {
    children?: React.ReactNode;
  }
}

DialogRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * A ref to imperative actions.
   */
  action: PropTypes.shape({
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
   * Determines whether the dialog should close on outside clicks.
   * @default true
   */
  dismissible: PropTypes.bool,
  /**
   * Whether the dialog should prevent outside clicks and lock page scroll when open.
   * @default true
   */
  modal: PropTypes.bool,
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

export { DialogRoot };
