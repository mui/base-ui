'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { DialogRootContext } from './DialogRootContext';
import { CommonParameters, useDialogRoot } from './useDialogRoot';

/**
 *
 * Demos:
 *
 * - [Dialog](https://base-ui.netlify.app/components/react-dialog/)
 *
 * API:
 *
 * - [DialogRoot API](https://base-ui.netlify.app/components/react-dialog/#api-reference-DialogRoot)
 */
const DialogRoot = function DialogRoot(props: DialogRoot.Props) {
  const {
    children,
    defaultOpen,
    modal = true,
    onOpenChange,
    open: openProp,
    dismissible = true,
    animated = true,
  } = props;

  const dialogRootContext = React.useContext(DialogRootContext);

  const dialogRoot = useDialogRoot({
    open: openProp,
    defaultOpen,
    onOpenChange,
    modal,
    dismissible,
    onNestedDialogClose: dialogRootContext?.onNestedDialogClose,
    onNestedDialogOpen: dialogRootContext?.onNestedDialogOpen,
  });

  const hasParentDialog = Boolean(dialogRootContext);

  const contextValue = React.useMemo(
    () => ({ ...dialogRoot, hasParentDialog, dismissible, animated }),
    [dialogRoot, hasParentDialog, dismissible, animated],
  );

  return <DialogRootContext.Provider value={contextValue}>{children}</DialogRootContext.Provider>;
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
   * If `true`, the dialog supports CSS-based animations and transitions.
   * It is kept in the DOM until the animation completes.
   *
   * @default true
   */
  animated: PropTypes.bool,
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
