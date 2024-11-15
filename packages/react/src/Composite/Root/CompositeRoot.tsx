'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { CompositeList } from '../List/CompositeList';
import { useCompositeRoot } from './useCompositeRoot';
import { CompositeRootContext } from './CompositeRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Dimensions } from '../composite';

/**
 * @ignore - internal component.
 */
const CompositeRoot = React.forwardRef(function CompositeRoot(
  props: CompositeRoot.Props,
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
    enableHomeAndEndKeys,
    onMapChange,
    alwaysPropagateEvents,
    ...otherProps
  } = props;

  const { getRootProps, activeIndex, onActiveIndexChange, elementsRef } = useCompositeRoot({
    itemSizes,
    cols,
    loop,
    dense,
    orientation,
    activeIndex: activeIndexProp,
    onActiveIndexChange: onActiveIndexChangeProp,
    rootRef: forwardedRef,
    alwaysPropagateEvents,
    enableHomeAndEndKeys,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    ref: forwardedRef,
    render: render ?? 'div',
    ownerState: {},
    className,
    extraProps: otherProps,
  });

  const contextValue: CompositeRootContext = React.useMemo(
    () => ({ activeIndex, onActiveIndexChange }),
    [activeIndex, onActiveIndexChange],
  );

  return (
    <CompositeRootContext.Provider value={contextValue}>
      <CompositeList elementsRef={elementsRef} onMapChange={onMapChange}>
        {renderElement()}
      </CompositeList>
    </CompositeRootContext.Provider>
  );
});

namespace CompositeRoot {
  export interface OwnerState {}

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    orientation?: 'horizontal' | 'vertical' | 'both';
    cols?: number;
    loop?: boolean;
    activeIndex?: number;
    onActiveIndexChange?: (index: number) => void;
    itemSizes?: Dimensions[];
    dense?: boolean;
    enableHomeAndEndKeys?: boolean;
    // TODO: can't pass a generic <CustomMetadata> into forwardRef?
    onMapChange?: (newMap: Map<Node, any>) => void;
    alwaysPropagateEvents?: boolean;
  }
}

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
  enableHomeAndEndKeys: PropTypes.bool,
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
