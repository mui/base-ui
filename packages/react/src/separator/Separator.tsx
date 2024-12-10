'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../utils/types';
import { useComponentRenderer } from '../utils/useComponentRenderer';

const EMPTY_OBJECT = {};

/**
 *
 * Demos:
 *
 * - [Separator](https://base-ui.com/components/react-separator/)
 *
 * API:
 *
 * - [Separator API](https://base-ui.com/components/react-separator/#api-reference-Separator)
 */
const Separator = React.forwardRef(function SeparatorComponent(
  props: Separator.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...other } = props;

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state: EMPTY_OBJECT,
    extraProps: { role: 'separator', ...other },
    ref: forwardedRef,
  });

  return renderElement();
});

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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

namespace Separator {
  export interface Props extends BaseUIComponentProps<'div', State> {}

  export interface State {}
}

export { Separator };
