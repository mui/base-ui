'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useAlertDialogRootContext } from '../Root/AlertDialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { BaseUIComponentProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupOpenStateMapping';

/**
 *
 * Demos:
 *
 * - [Alert Dialog](https://base-ui.netlify.app/components/react-alert-dialog/)
 *
 * API:
 *
 * - [AlertDialogTrigger API](https://base-ui.netlify.app/components/react-alert-dialog/#api-reference-AlertDialogTrigger)
 */
const AlertDialogTrigger = React.forwardRef(function AlertDialogTrigger(
  props: AlertDialogTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, ...other } = props;
  const { open, setTriggerElement, getTriggerProps } = useAlertDialogRootContext();

  const ownerState: AlertDialogTrigger.OwnerState = React.useMemo(() => ({ open }), [open]);

  const mergedRef = useForkRef(forwardedRef, setTriggerElement);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'button',
    className,
    ownerState,
    propGetter: getTriggerProps,
    extraProps: other,
    customStyleHookMapping: triggerOpenStateMapping,
    ref: mergedRef,
  });

  return renderElement();
});

namespace AlertDialogTrigger {
  export interface Props extends BaseUIComponentProps<'button', OwnerState> {}

  export interface OwnerState {
    open: boolean;
  }
}

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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { AlertDialogTrigger };
