'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useToastRootContext } from '../root/ToastRootContext';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useId } from '../../utils/useId';

/**
 * A title that labels the toast.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastTitle = React.forwardRef(function ToastTitle(
  props: ToastTitle.Props,
  forwardedRef: React.ForwardedRef<HTMLHeadingElement>,
) {
  const { render, className, id: idProp, children: childrenProp, ...other } = props;

  const { toast } = useToastRootContext();

  const children = childrenProp ?? toast.title;

  const shouldRender = Boolean(children);

  const id = useId(idProp);

  const { setTitleId } = useToastRootContext();

  useEnhancedEffect(() => {
    if (!shouldRender) {
      return undefined;
    }

    setTitleId(id);

    return () => {
      setTitleId(undefined);
    };
  }, [shouldRender, id, setTitleId]);

  const state: ToastTitle.State = React.useMemo(
    () => ({
      type: toast.type,
    }),
    [toast.type],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'h2',
    ref: forwardedRef,
    className,
    state,
    extraProps: {
      ...other,
      id,
      children,
    },
  });

  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace ToastTitle {
  export interface State {
    /**
     * The type of the toast.
     */
    type: string | undefined;
  }

  export interface Props extends BaseUIComponentProps<'h2', State> {}
}

ToastTitle.propTypes /* remove-proptypes */ = {
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

export { ToastTitle };
