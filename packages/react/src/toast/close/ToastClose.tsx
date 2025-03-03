'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useToastRootContext } from '../root/ToastRootContext';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useToastContext } from '../provider/ToastProviderContext';

const state = {};

/**
 * Closes the toast when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastClose = React.forwardRef(function ToastClose(
  props: ToastClose.Props,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, ...other } = props;

  const { dismissToast } = useToastContext();
  const { toast, rootRef } = useToastRootContext();

  const { renderElement } = useComponentRenderer({
    render: render ?? 'button',
    ref,
    className,
    state,
    extraProps: mergeReactProps<'button'>(other, {
      onClick() {
        dismissToast(toast.id, rootRef.current);
      },
    }),
  });

  return renderElement();
});

namespace ToastClose {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'button', State> {}
}

ToastClose.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { ToastClose };
