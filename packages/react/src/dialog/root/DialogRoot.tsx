'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { DialogRootContext } from './DialogRootContext';
import { type CommonParameters, useDialogRoot } from './useDialogRoot';

/**
 * Groups all parts of the dialog. Doesn’t render its own HTML element.
 *
 * Demos:
 *
 * - [Dialog](https://base-ui.com/components/react-dialog/)
 *
 * API:
 *
 * - [DialogRoot API](https://base-ui.com/components/react-dialog/#api-reference-DialogRoot)
 */
const DialogRoot = function DialogRoot(props: DialogRoot.Props) {
  const {
    animated = true,
    children,
    defaultOpen = false,
    dismissible = true,
    modal = true,
    onOpenChange,
    open,
  } = props;

  const parentDialogRootContext = React.useContext(DialogRootContext);

  const dialogRoot = useDialogRoot({
    animated,
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
   *
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
