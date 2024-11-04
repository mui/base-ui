'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { usePopoverRootContext } from '../Root/PopoverRootContext';
import { usePopoverClose } from './usePopoverClose';

const ownerState = {};

/**
 * Renders a button that closes the popover when clicked.
 *
 * Demos:
 *
 * - [Popover](https://base-ui.netlify.app/components/react-popover/)
 *
 * API:
 *
 * - [PopoverClose API](https://base-ui.netlify.app/components/react-popover/#api-reference-PopoverClose)
 */
const PopoverClose = React.forwardRef(function PopoverClose(
  props: PopoverClose.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, ...otherProps } = props;

  const { setOpen } = usePopoverRootContext();

  const { getCloseProps } = usePopoverClose({
    onClose() {
      setOpen(false);
    },
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getCloseProps,
    render: render ?? 'button',
    className,
    ownerState,
    extraProps: otherProps,
    ref: forwardedRef,
  });

  return renderElement();
});

namespace PopoverClose {
  export interface OwnerState {}

  export type Props = BaseUIComponentProps<'button', OwnerState> & {};
}

PopoverClose.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.any.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      then: PropTypes.func.isRequired,
    }),
    PropTypes.string,
    PropTypes.bool,
  ]),
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { PopoverClose };
