import * as React from 'react';
import PropTypes from 'prop-types';
import { useDialogRootContext } from '../Root/DialogRootContext';
import type { DialogBackdropOwnerState, DialogBackdropProps } from './DialogBackdrop.types';
import { useBaseUIComponentRenderer } from '../../utils/useBaseUIComponentRenderer';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { OpenState, useTransitionedElement } from '../../Transitions';

const DialogBackdrop = React.forwardRef(function DialogBackdrop(
  props: DialogBackdropProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, animated = false, ...other } = props;
  const { open, modal } = useDialogRootContext();

  const {
    getRootProps: getTransitionProps,
    openState,
    mounted,
  } = useTransitionedElement({ isRendered: open, enabled: animated });

  const ownerState: DialogBackdropOwnerState = { open, modal, openState: openState as OpenState };

  const { renderElement } = useBaseUIComponentRenderer({
    render: render ?? defaultRenderFunctions.div,
    className,
    ownerState,
    ref: forwardedRef,
    extraProps: getTransitionProps({
      role: 'presentation',
      ...other,
    }),
    customStyleHookMapping: {
      open: () => null,
      openState: (value) => ({ 'data-state': value }),
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
