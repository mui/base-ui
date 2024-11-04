'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useDialogClose } from './useDialogClose';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';

const ownerState = {};

/**
 *
 * Demos:
 *
 * - [Dialog](https://base-ui.netlify.app/components/react-dialog/)
 *
 * API:
 *
 * - [DialogClose API](https://base-ui.netlify.app/components/react-dialog/#api-reference-DialogClose)
 */
const DialogClose = React.forwardRef(function DialogClose(
  props: DialogClose.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, ...other } = props;
  const { open, onOpenChange } = useDialogRootContext();
  const { getRootProps } = useDialogClose({ open, onOpenChange });

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

namespace DialogClose {
  export type Props = BaseUIComponentProps<'button', OwnerState> & {};

  export interface OwnerState {}
}

DialogClose.propTypes /* remove-proptypes */ = {
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

export { DialogClose };
