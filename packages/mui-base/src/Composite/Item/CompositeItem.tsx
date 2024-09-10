'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { useCompositeRootContext } from '../Root/CompositeRootContext';
import { useCompositeItem } from './useCompositeItem';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * @ignore - internal component.
 */
const CompositeItem = React.forwardRef(function CompositeItem(
  props: CompositeItem.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...otherProps } = props;

  const { activeIndex } = useCompositeRootContext();
  const { getItemProps, ref, index } = useCompositeItem();

  const ownerState: CompositeItem.OwnerState = React.useMemo(
    () => ({
      active: index === activeIndex,
    }),
    [index, activeIndex],
  );

  const mergedRef = useForkRef(forwardedRef, ref);

  const { renderElement } = useComponentRenderer({
    propGetter: getItemProps,
    ref: mergedRef,
    render: render ?? 'div',
    ownerState,
    className,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace CompositeItem {
  export interface OwnerState {
    active: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {}
}

CompositeItem.propTypes /* remove-proptypes */ = {
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

export { CompositeItem };
