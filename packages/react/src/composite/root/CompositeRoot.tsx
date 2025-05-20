'use client';
import * as React from 'react';
import { CompositeList, type CompositeMetadata } from '../list/CompositeList';
import { useCompositeRoot } from './useCompositeRoot';
import { CompositeRootContext } from './CompositeRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import type { TextDirection } from '../../direction-provider/DirectionContext';
import type { Dimensions, ModifierKey } from '../composite';
import { useEventCallback } from '../../utils/useEventCallback';

const COMPOSITE_ROOT_STATE = {};

/**
 * @internal
 */
export function CompositeRoot<Metadata extends {}>(componentProps: CompositeRoot.Props<Metadata>) {
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
    onMapChange: onMapChangeProp,
    stopEventPropagation,
    rootRef,
    disabledIndices,
    modifierKeys,
    highlightItemOnHover = false,
    ...elementProps
  } = componentProps;

  const {
    props,
    highlightedIndex,
    onHighlightedIndexChange,
    elementsRef,
    onMapChange: onMapChangeUnwrapped,
  } = useCompositeRoot({
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

  const onMapChange = useEventCallback(
    (newMap: Map<Element, CompositeMetadata<Metadata> | null>) => {
      onMapChangeProp?.(newMap);
      onMapChangeUnwrapped(newMap);
    },
  );

  const element = useRenderElement('div', componentProps, {
    state: COMPOSITE_ROOT_STATE,
    props: [props, elementProps],
  });

  const contextValue: CompositeRootContext = React.useMemo(
    () => ({ highlightedIndex, onHighlightedIndexChange, highlightItemOnHover }),
    [highlightedIndex, onHighlightedIndexChange, highlightItemOnHover],
  );

  return (
    <CompositeRootContext.Provider value={contextValue}>
      <CompositeList<Metadata> elementsRef={elementsRef} onMapChange={onMapChange}>
        {element}
      </CompositeList>
    </CompositeRootContext.Provider>
  );
}

export namespace CompositeRoot {
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
    highlightItemOnHover?: boolean;
  }
}
