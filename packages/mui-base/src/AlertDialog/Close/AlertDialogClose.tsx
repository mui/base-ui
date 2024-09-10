import * as React from 'react';
import PropTypes from 'prop-types';
import { useAlertDialogRootContext } from '../Root/AlertDialogRootContext';
import { useDialogClose } from '../../Dialog/Close/useDialogClose';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 *
 * Demos:
 *
 * - [Alert Dialog](https://base-ui.netlify.app/components/react-alert-dialog/)
 *
 * API:
 *
 * - [AlertDialogClose API](https://base-ui.netlify.app/components/react-alert-dialog/#api-reference-AlertDialogClose)
 */
const AlertDialogClose = React.forwardRef(function AlertDialogClose(
  props: AlertDialogClose.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, ...other } = props;
  const { open, onOpenChange } = useAlertDialogRootContext();
  const { getRootProps } = useDialogClose({ open, onOpenChange });

  const ownerState: AlertDialogClose.OwnerState = {
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

namespace AlertDialogClose {
  export interface Props extends BaseUIComponentProps<'button', OwnerState> {}

  export interface OwnerState {
    open: boolean;
  }
}

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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { AlertDialogClose };
