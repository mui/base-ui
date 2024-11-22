'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { CompositeList, type CompositeMetadata } from '../List/CompositeList';
import { useCompositeRoot } from './useCompositeRoot';
import { CompositeRootContext } from './CompositeRootContext';
import { refType } from '../../utils/proptypes';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Dimensions } from '../composite';

/**
 * @ignore - internal component.
 */
function CompositeRoot<Metadata extends {}>(props: CompositeRoot.Props<Metadata>) {
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
    stopEventPropagation,
    rootRef,
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
    rootRef,
    stopEventPropagation,
    enableHomeAndEndKeys,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
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
      <CompositeList<Metadata> elementsRef={elementsRef} onMapChange={onMapChange}>
        {renderElement()}
      </CompositeList>
    </CompositeRootContext.Provider>
  );
}

namespace CompositeRoot {
  export interface OwnerState {}

  export interface Props<Metadata> extends BaseUIComponentProps<'div', OwnerState> {
    orientation?: 'horizontal' | 'vertical' | 'both';
    cols?: number;
    loop?: boolean;
    activeIndex?: number;
    onActiveIndexChange?: (index: number) => void;
    itemSizes?: Dimensions[];
    dense?: boolean;
    enableHomeAndEndKeys?: boolean;
    onMapChange?: (newMap: Map<Node, CompositeMetadata<Metadata> | null>) => void;
    stopEventPropagation?: boolean;
    rootRef?: React.RefObject<HTMLElement | null>;
  }
}

export { CompositeRoot };

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
  onMapChange: PropTypes.func,
  /**
   * @ignore
   */
  orientation: PropTypes.oneOf(['both', 'horizontal', 'vertical']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  rootRef: refType,
  /**
   * @ignore
   */
  stopEventPropagation: PropTypes.bool,
} as any;
