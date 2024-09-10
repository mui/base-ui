import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import type { DialogBackdropOwnerState, DialogBackdropProps } from './DialogBackdrop.types';
import { useDialogBackdrop } from './useDialogBackdrop';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

/**
 *
 * Demos:
 *
 * - [Dialog](https://base-ui.netlify.app/components/react-dialog/)
 *
 * API:
 *
 * - [DialogBackdrop API](https://base-ui.netlify.app/components/react-dialog/#api-reference-DialogBackdrop)
 */
const DialogBackdrop = React.forwardRef(function DialogBackdrop(
  props: DialogBackdropProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, keepMounted = false, ...other } = props;
  const { open, modal, hasParentDialog, setBackdropPresent, animated } = useDialogRootContext();

  const handleMount = React.useCallback(() => setBackdropPresent(true), [setBackdropPresent]);
  const handleUnmount = React.useCallback(() => setBackdropPresent(false), [setBackdropPresent]);

  const { getRootProps, mounted, transitionStatus } = useDialogBackdrop({
    animated,
    open,
    ref: forwardedRef,
    onMount: handleMount,
    onUnmount: handleUnmount,
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

DialogBackdrop.propTypes /* remove-proptypes */ = {
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

export { DialogBackdrop };
