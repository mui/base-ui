import * as React from 'react';
import PropTypes from 'prop-types';
import { DialogRootOwnerState, DialogRootProps } from './DialogRoot.types';
import { DialogRootContext } from './DialogRootContext';
import { useDialogRoot } from './useDialogRoot';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { useBaseUIComponentRenderer } from '../../utils/useBaseUIComponentRenderer';

const DialogRoot = React.forwardRef(function DialogRoot(
  props: DialogRootProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    modal = true,
    onOpenChange,
    open: openProp,
    defaultOpen,
    type = 'dialog',
    closeOnClickOutside,
    ...other
  } = props;

  const { open, contextValue } = useDialogRoot({
    open: openProp,
    defaultOpen,
    onOpenChange,
    type,
    modal,
    closeOnClickOutside,
  });

  const ownerState: DialogRootOwnerState = {
    open,
    modal,
    type,
  };

  const { renderElement } = useBaseUIComponentRenderer({
    render: render ?? defaultRenderFunctions.Fragment,
    className,
    ownerState,
    ref: forwardedRef,
    extraProps: other,
    customStyleHookMapping: { open: (value) => ({ 'data-state': value ? 'open' : 'closed' }) },
  });

  return (
    <DialogRootContext.Provider value={contextValue}>{renderElement()}</DialogRootContext.Provider>
  );
});

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
  type: PropTypes.oneOf(['alertdialog', 'dialog']),
} as any;

export { DialogRoot };
