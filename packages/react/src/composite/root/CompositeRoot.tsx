'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { CompositeList, type CompositeMetadata } from '../list/CompositeList';
import { useCompositeRoot } from './useCompositeRoot';
import { CompositeRootContext } from './CompositeRootContext';
import { refType } from '../../utils/proptypes';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import type { TextDirection } from '../../direction-provider/DirectionContext';
import type { Dimensions } from '../composite';

/**
 * @ignore - internal component.
 */
function CompositeRoot<Metadata extends {}>(props: CompositeRoot.Props<Metadata>) {
  const {
    render,
    className,
    highlightedIndex: highlightedIndexProp,
    onHighlightedIndexChange: onHighlightedIndexChangeProp,
    orientation,
    dense,
    itemSizes,
    loop,
    cols,
    direction,
    enableHomeAndEndKeys,
    onMapChange,
    stopEventPropagation,
    rootRef,
    ...otherProps
  } = props;

  const { getRootProps, highlightedIndex, onHighlightedIndexChange, elementsRef } =
    useCompositeRoot({
      itemSizes,
      cols,
      loop,
      dense,
      orientation,
      highlightedIndex: highlightedIndexProp,
      onHighlightedIndexChange: onHighlightedIndexChangeProp,
      rootRef,
      stopEventPropagation,
      enableHomeAndEndKeys,
      direction,
    });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    state: {},
    className,
    extraProps: otherProps,
  });

  const contextValue: CompositeRootContext = React.useMemo(
    () => ({ highlightedIndex, onHighlightedIndexChange }),
    [highlightedIndex, onHighlightedIndexChange],
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
  export interface State {}

  export interface Props<Metadata> extends BaseUIComponentProps<'div', State> {
    orientation?: 'horizontal' | 'vertical' | 'both';
    cols?: number;
    loop?: boolean;
    highlightedIndex?: number;
    onHighlightedIndexChange?: (index: number) => void;
    itemSizes?: Dimensions[];
    dense?: boolean;
    direction?: TextDirection;
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
  direction: PropTypes.oneOf(['ltr', 'rtl']),
  /**
   * @ignore
   */
  enableHomeAndEndKeys: PropTypes.bool,
  /**
   * @ignore
   */
  highlightedIndex: PropTypes.number,
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
  onHighlightedIndexChange: PropTypes.func,
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
