import * as React from 'react';
import PropTypes from 'prop-types';
import { useDialogRootContext } from '../Root/DialogRootContext';
import type { DialogBackdropOwnerState, DialogBackdropProps } from './DialogBackdrop.types';
import { useBaseUIComponentRenderer } from '../../utils/useBaseUIComponentRenderer';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { useTransitionStatus } from '../../Transitions';

const DialogBackdrop = React.forwardRef(function DialogBackdrop(
  props: DialogBackdropProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, animated = false, ...other } = props;
  const { open, modal } = useDialogRootContext();
  const ownerState: DialogBackdropOwnerState = { open, modal };

  const { props: transitionProps, transitionStatus, mounted } = useTransitionStatus(open, animated);

  const { renderElement } = useBaseUIComponentRenderer({
    render: render ?? defaultRenderFunctions.div,
    className,
    ownerState,
    ref: forwardedRef,
    // TODO: merge props
    extraProps: {
      role: 'presentation',
      ...transitionProps,
      ...other,
      'data-status': transitionStatus,
    },
  });

  if (!mounted) {
    return null;
  }

  return renderElement();
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
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { DialogBackdrop };
