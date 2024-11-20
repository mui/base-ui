'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

const EMPTY_OBJECT = {};

/**
 *
 * Demos:
 *
 * - [Separator](https://base-ui.netlify.app/components/react-separator/)
 *
 * API:
 *
 * - [SeparatorRoot API](https://base-ui.netlify.app/components/react-separator/#api-reference-SeparatorRoot)
 */
const SeparatorRoot = React.forwardRef(function SeparatorRootComponent(
  props: SeparatorRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...other } = props;

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    ownerState: EMPTY_OBJECT,
    extraProps: { role: 'separator', ...other },
    ref: forwardedRef,
  });

  return renderElement();
});

SeparatorRoot.propTypes /* remove-proptypes */ = {
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

namespace SeparatorRoot {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {}

  export interface OwnerState {}
}

export { SeparatorRoot };
