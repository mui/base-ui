'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { CompositeList } from '../utils/CompositeList/CompositeList';
import type { CompositeRootProps } from './CompositeRoot.types';
import { useCompositeRoot } from './useCompositeRoot';
import { CompositeRootContext, type CompositeRootContextValue } from './CompositeRootContext';

/**
 * @ignore - internal component.
 */
const CompositeRoot = React.forwardRef(function CompositeRoot(
  props: CompositeRootProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    activeIndex: activeIndexProp,
    onActiveIndexChange: onActiveIndexChangeProp,
    orientation,
    dense,
    itemSizes,
    loop,
    cols,
    ...otherProps
  } = props;

  const { getRootProps, activeIndex, onActiveIndexChange, elementsRef } = useCompositeRoot(props);

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    ref: forwardedRef,
    render: render ?? 'div',
    ownerState: {},
    className,
    extraProps: otherProps,
  });

  const contextValue: CompositeRootContextValue = React.useMemo(
    () => ({ activeIndex, onActiveIndexChange }),
    [activeIndex, onActiveIndexChange],
  );

  return (
    <CompositeRootContext.Provider value={contextValue}>
      <CompositeList elementsRef={elementsRef}>{renderElement()}</CompositeList>
    </CompositeRootContext.Provider>
  );
});

CompositeRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  activeIndex: PropTypes.number,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  cols: PropTypes.number,
  /**
   * @ignore
   */
  dense: PropTypes.bool,
  /**
   * @ignore
   */
  itemSizes: PropTypes.arrayOf(
    PropTypes.shape({
      height: PropTypes.number.isRequired,
      width: PropTypes.number.isRequired,
    }),
  ),
  /**
   * @ignore
   */
  loop: PropTypes.bool,
  /**
   * @ignore
   */
  onActiveIndexChange: PropTypes.func,
  /**
   * @ignore
   */
  orientation: PropTypes.oneOf(['both', 'horizontal', 'vertical']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { CompositeRoot };
