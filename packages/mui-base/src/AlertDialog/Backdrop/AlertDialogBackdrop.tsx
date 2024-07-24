import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import type {
  AlertDialogBackdropOwnerState,
  AlertDialogBackdropProps,
} from './AlertDialogBackdrop.types';
import { useAlertDialogRootContext } from '../Root/AlertDialogRootContext';
import { useDialogBackdrop } from '../../Dialog/Backdrop/useDialogBackdrop';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

const AlertDialogBackdrop = React.forwardRef(function AlertDialogBackdrop(
  props: AlertDialogBackdropProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, keepMounted = false, ...other } = props;
  const { open, hasParentDialog, setBackdropPresent, animated } = useAlertDialogRootContext();

  const handleMount = React.useCallback(() => setBackdropPresent(true), [setBackdropPresent]);
  const handleUnmount = React.useCallback(() => setBackdropPresent(false), [setBackdropPresent]);

  const { getRootProps, mounted, transitionStatus } = useDialogBackdrop({
    animated,
    open,
    ref: forwardedRef,
    onMount: handleMount,
    onUnmount: handleUnmount,
  });

  const ownerState: AlertDialogBackdropOwnerState = { open, transitionStatus };

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    ownerState,
    propGetter: getRootProps,
    extraProps: other,
    customStyleHookMapping: {
      open: (value) => ({ 'data-state': value ? 'open' : 'closed' }),
      transitionStatus: (value) => {
        if (value === 'entering') {
          return { 'data-entering': '' } as Record<string, string>;
        }
        if (value === 'exiting') {
          return { 'data-exiting': '' };
        }
        return null;
      },
    },
  });

  if (!mounted && !keepMounted) {
    return null;
  }

  if (hasParentDialog) {
    // no need to render nested backdrops
    return null;
  }

  return <FloatingPortal>{renderElement()}</FloatingPortal>;
});

AlertDialogBackdrop.propTypes /* remove-proptypes */ = {
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
   * If `true`, the backdrop element is kept in the DOM when closed.
   *
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { AlertDialogBackdrop };
