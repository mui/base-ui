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
    softClose,
    ...other
  } = props;

  const { open, contextValue } = useDialogRoot({
    open: openProp,
    defaultOpen,
    onOpenChange,
    type,
    modal,
    softClose,
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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
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
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
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
