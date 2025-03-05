'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useToastRootContext } from '../root/ToastRootContext';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useToastContext } from '../provider/ToastProviderContext';

const state = {};

/**
 * Groups content parts of the toast (title and description) to be announced.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastContent = React.forwardRef(function ToastContent(
  props: ToastContent.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...other } = props;

  const { focused } = useToastContext();
  const { toast } = useToastRootContext();

  const [renderChildren, setRenderChildren] = React.useState(false);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    ref: forwardedRef,
    className,
    state,
    extraProps: other,
  });

  React.useEffect(() => {
    const timeout = setTimeout(
      () => {
        setRenderChildren(true);
      },
      // macOS Safari needs some time to pass after the status node has been
      // created before changing its text content to reliably announce the toast
      50,
    );
    return () => clearTimeout(timeout);
  }, []);

  return (
    <React.Fragment>
      {renderElement()}
      {!focused && (
        <div
          style={visuallyHidden}
          {...(toast.priority === 'high'
            ? { role: 'alert', 'aria-atomic': true }
            : { role: 'status', 'aria-live': 'polite' })}
        >
          {/* Screen readers won't announce the text upon DOM insertion
          of the component. We need to wait until the next tick to render the children
          so that screen readers can announce the contents. */}
          {renderChildren && (
            <React.Fragment>
              <div>{toast.title}</div>
              <div>{toast.description}</div>
            </React.Fragment>
          )}
        </div>
      )}
    </React.Fragment>
  );
});

namespace ToastContent {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

ToastContent.propTypes /* remove-proptypes */ = {
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

export { ToastContent };
