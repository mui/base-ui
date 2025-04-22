'use client';
import * as React from 'react';
import { CompositeList, type CompositeMetadata } from '../list/CompositeList';
import { useCompositeRoot } from './useCompositeRoot';
import { CompositeRootContext } from './CompositeRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import type { TextDirection } from '../../direction-provider/DirectionContext';
import type { Dimensions, ModifierKey } from '../composite';

/**
 * @internal
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
    disabledIndices,
    modifierKeys,
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
      disabledIndices,
      modifierKeys,
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
    disabledIndices?: number[];
    modifierKeys?: ModifierKey[];
  }
}

export { CompositeRoot };
