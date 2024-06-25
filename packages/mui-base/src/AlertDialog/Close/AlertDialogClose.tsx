import * as React from 'react';
import PropTypes from 'prop-types';
import { AlertDialogCloseOwnerState, AlertDialogCloseProps } from './AlertDialogClose.types';
import { useAlertDialogRootContext } from '../Root/AlertDialogRootContext';
import { useDialogClose } from '../../Dialog/Close/useDialogClose';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

const AlertDialogClose = React.forwardRef(function AlertDialogClose(
  props: AlertDialogCloseProps,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, ...other } = props;
  const { open, onOpenChange } = useAlertDialogRootContext();
  const { getRootProps } = useDialogClose({ open, onOpenChange });

  const ownerState: AlertDialogCloseOwnerState = {
    open,
  };

  const { renderElement } = useComponentRenderer({
    render: render ?? 'button',
    className,
    ownerState,
    propGetter: getRootProps,
    ref: forwardedRef,
    extraProps: other,
  });

  return renderElement();
});

AlertDialogClose.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's
   * `ownerState`.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A React element or function that returns one to customize the element rendered by the
   * component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { AlertDialogClose };
