'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { DialogRootContext, useOptionalDialogRootContext } from './DialogRootContext';
import { DialogContext } from '../utils/DialogContext';
import { useDialogRoot } from './useDialogRoot';

/**
 * Groups all parts of the dialog.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
const DialogRoot: React.FC<DialogRoot.Props> = function DialogRoot(props) {
  const {
    children,
    defaultOpen = false,
    dismissible = true,
    modal = true,
    onOpenChange,
    open,
    actionsRef,
    onOpenChangeComplete,
  } = props;

  const parentDialogRootContext = useOptionalDialogRootContext();

  const dialogRoot = useDialogRoot({
    open,
    defaultOpen,
    onOpenChange,
    modal,
    dismissible,
    actionsRef,
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
  export interface Props extends useDialogRoot.SharedParameters {
    children?: React.ReactNode;
  }

  export type Actions = useDialogRoot.Actions;
}

DialogRoot.propTypes /* remove-proptypes */ = {
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
   * Determines whether the dialog should close on outside clicks.
   * @default true
   */
  dismissible: PropTypes.bool,
  /**
   * Determines if the dialog enters a modal state when open.
   * - `true`: user interaction is limited to just the dialog: focus is trapped, document page scroll is locked, and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * - `'trap-focus'`: focus is trapped inside the dialog, but document page scroll is not locked and pointer interactions outside of it remain enabled.
   * @default true
   */
  modal: PropTypes.oneOfType([PropTypes.oneOf(['trap-focus']), PropTypes.bool]),
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
