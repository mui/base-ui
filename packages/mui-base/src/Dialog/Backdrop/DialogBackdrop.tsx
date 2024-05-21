import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import type { DialogBackdropOwnerState, DialogBackdropProps } from './DialogBackdrop.types';
import { useBaseUIComponentRenderer } from '../../utils/useBaseUIComponentRenderer';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { useDialogBackdrop } from './useDialogBackdrop';
import { useDialogRootContext } from '../Root/DialogRootContext';

const DialogBackdrop = React.forwardRef(function DialogBackdrop(
  props: DialogBackdropProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, animated = false, keepMounted = false, ...other } = props;
  const { open, modal, hasParentDialog } = useDialogRootContext();
  const { getRootProps, mounted } = useDialogBackdrop({ animated, open });

  const ownerState: DialogBackdropOwnerState = React.useMemo(
    () => ({ open, modal }),
    [open, modal],
  );

  const { renderElement } = useBaseUIComponentRenderer({
    render: render ?? defaultRenderFunctions.div,
    className,
    ownerState,
    propGetter: getRootProps,
    ref: forwardedRef,
    extraProps: other,
    customStyleHookMapping: {
      open: (value) => ({ 'data-state': value ? 'open' : 'closed' }),
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
   * @ignore
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { DialogBackdrop };
