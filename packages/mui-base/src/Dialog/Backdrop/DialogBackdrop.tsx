import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import type { DialogBackdropOwnerState, DialogBackdropProps } from './DialogBackdrop.types';
import { useDialogBackdrop } from './useDialogBackdrop';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

const DialogBackdrop = React.forwardRef(function DialogBackdrop(
  props: DialogBackdropProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, animated = false, keepMounted = false, ...other } = props;
  const { open, modal, hasParentDialog } = useDialogRootContext();
  const { getRootProps, mounted, transitionStatus } = useDialogBackdrop({
    animated,
    open,
    ref: forwardedRef,
  });

  const ownerState: DialogBackdropOwnerState = React.useMemo(
    () => ({ open, modal, transitionStatus }),
    [open, modal, transitionStatus],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    ownerState,
    propGetter: getRootProps,
    extraProps: other,
    customStyleHookMapping: {
      open: (value) => ({ 'data-state': value ? 'open' : 'closed' }),
      transitionStatus: (value) =>
        value !== undefined ? { 'data-transition-status': value } : null,
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

DialogBackdrop.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * If `true`, the dialog supports CSS-based animations and transitions.
   * It is kept in the DOM until the animation completes.
   *
   * @default false
   */
  animated: PropTypes.bool,
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

export { DialogBackdrop };
