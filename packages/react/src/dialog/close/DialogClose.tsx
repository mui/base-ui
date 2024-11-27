'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useDialogClose } from './useDialogClose';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';

const state = {};

/**
 *
 * Demos:
 *
 * - [Dialog](https://base-ui.com/components/react-dialog/)
 *
 * API:
 *
 * - [DialogClose API](https://base-ui.com/components/react-dialog/#api-reference-DialogClose)
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
    state,
    propGetter: getRootProps,
    ref: forwardedRef,
    extraProps: other,
  });

  return renderElement();
});

namespace DialogClose {
  export interface Props extends BaseUIComponentProps<'button', State> {}

  export interface State {}
}

DialogClose.propTypes /* remove-proptypes */ = {
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

export { DialogClose };
