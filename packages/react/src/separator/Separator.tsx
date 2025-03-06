'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps, Orientation } from '../utils/types';
import { mergeProps } from '../merge-props';
import { useComponentRenderer } from '../utils/useComponentRenderer';

/**
 * A separator element accessible to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Separator](https://base-ui.com/react/components/separator)
 */
const Separator = React.forwardRef(function SeparatorComponent(
  props: Separator.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, orientation = 'horizontal', ...other } = props;

  const state: Separator.State = React.useMemo(() => ({ orientation }), [orientation]);

  const getSeparatorProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps(
        {
          'aria-orientation': orientation,
        },
        externalProps,
      ),
    [orientation],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getSeparatorProps,
    render: render ?? 'div',
    className,
    state,
    extraProps: { role: 'separator', ...other },
    ref: forwardedRef,
  });

  return renderElement();
});

namespace Separator {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The orientation of the separator.
     * @default 'horizontal'
     */
    orientation?: Orientation;
  }

  export interface State {
    /**
     * The orientation of the separator.
     */
    orientation: Orientation;
  }
}

export { Separator };

Separator.propTypes /* remove-proptypes */ = {
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
   * The orientation of the separator.
   * @default 'horizontal'
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
