import * as React from 'react';
import PropTypes from 'prop-types';
import { useDialogTrigger } from '../../Dialog/Trigger/useDialogTrigger';
import type {
  AlertDialogTriggerOwnerState,
  AlertDialogTriggerProps,
} from './AlertDialogTrigger.types';
import { useAlertDialogRootContext } from '../Root/AlertDialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

const AlertDialogTrigger = React.forwardRef(function AlertDialogTrigger(
  props: AlertDialogTriggerProps,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, ...other } = props;
  const { open, onOpenChange, popupElementId } = useAlertDialogRootContext();

  const { getRootProps } = useDialogTrigger({
    open,
    onOpenChange,
    popupElementId,
  });

  const ownerState: AlertDialogTriggerOwnerState = { open };

  const { renderElement } = useComponentRenderer({
    render: render ?? 'button',
    className,
    ownerState,
    propGetter: getRootProps,
    extraProps: other,
    customStyleHookMapping: {
      open: (value) => ({ 'data-state': value ? 'open' : 'closed' }),
    },
    ref: forwardedRef,
  });

  return renderElement();
});

AlertDialogTrigger.propTypes /* remove-proptypes */ = {
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

export { AlertDialogTrigger };
