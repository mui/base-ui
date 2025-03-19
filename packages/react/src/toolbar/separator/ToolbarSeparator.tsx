'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps, Orientation } from '../../utils/types';
import { Separator } from '../../separator';
import { useToolbarRootContext } from '../root/ToolbarRootContext';
/**
 * A separator element accessible to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
const ToolbarSeparator = React.forwardRef(function ToolbarSeparator(
  props: ToolbarSeparator.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const context = useToolbarRootContext();

  const orientation = (
    {
      vertical: 'horizontal',
      horizontal: 'vertical',
    } as Record<Orientation, Orientation>
  )[context.orientation];

  return <Separator orientation={orientation} {...props} ref={forwardedRef} />;
});

ToolbarSeparator.propTypes /* remove-proptypes */ = {
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

namespace ToolbarSeparator {
  export interface Props extends BaseUIComponentProps<'div', Separator.State>, Separator.Props {}
}

export { ToolbarSeparator };
