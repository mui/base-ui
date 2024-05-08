import * as React from 'react';
import PropTypes from 'prop-types';
import { DialogRootProps } from './DialogRoot.types';
import { DialogRootContext } from './DialogRootContext';
import { useDialogRoot } from './useDialogRoot';
import { TransitionContext } from '../../useTransition';

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

  const { contextValue, transitionContextValue } = useDialogRoot({
    open: openProp,
    defaultOpen,
    onOpenChange,
    type,
    modal,
    softClose,
  });

  return (
    <DialogRootContext.Provider value={contextValue}>
      <TransitionContext.Provider value={transitionContextValue}>
        {children}
      </TransitionContext.Provider>
    </DialogRootContext.Provider>
  );
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
   * @ignore
   */
  defaultOpen: PropTypes.bool,
  /**
   * @ignore
   */
  modal: PropTypes.bool,
  /**
   * @ignore
   */
  onOpenChange: PropTypes.func,
  /**
   * @ignore
   */
  open: PropTypes.bool,
  /**
   * @ignore
   */
  softClose: PropTypes.oneOfType([PropTypes.oneOf(['clickOutside', 'escapeKey']), PropTypes.bool]),
  /**
   * @ignore
   */
  type: PropTypes.oneOf(['alertdialog', 'dialog']),
} as any;

export { DialogRoot };
