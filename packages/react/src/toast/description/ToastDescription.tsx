'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useToastRootContext } from '../root/ToastRootContext';
import { useId } from '../../utils/useId';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';

const state = {};

/**
 * A description that describes the toast.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastDescription = React.forwardRef(function ToastDescription(
  props: ToastDescription.Props,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { render, className, id: idProp, ...other } = props;

  const shouldRender = Boolean(other.children);

  const id = useId(idProp);

  const { setDescriptionId } = useToastRootContext();

  useEnhancedEffect(() => {
    if (!shouldRender) {
      return undefined;
    }

    setDescriptionId(id);

    return () => {
      setDescriptionId(undefined);
    };
  }, [shouldRender, id, setDescriptionId]);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'p',
    ref: forwardedRef,
    className,
    state,
    extraProps: {
      id,
      ...other,
    },
  });

  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace ToastDescription {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'p', State> {}
}

ToastDescription.propTypes /* remove-proptypes */ = {
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
   * @ignore
   */
  id: PropTypes.string,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { ToastDescription };
