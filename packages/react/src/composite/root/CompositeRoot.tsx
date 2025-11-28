'use client';
import * as React from 'react';
import { CompositeList, type CompositeMetadata } from '../list/CompositeList';
import { useCompositeRoot } from './useCompositeRoot';
import { CompositeRootContext } from './CompositeRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Dimensions, ModifierKey } from '../composite';
import { useDirection } from '../../direction-provider/DirectionContext';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '../../utils/constants';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';

/**
 * @internal
 */
export function CompositeRoot<Metadata extends {}, State extends Record<string, any>>(
  componentProps: CompositeRoot.Props<Metadata, State>,
) {
  const {
    render,
    className,
    refs = EMPTY_ARRAY as React.Ref<Element>[],
    props = EMPTY_ARRAY,
    state = EMPTY_OBJECT as State,
    stateAttributesMapping,
    highlightedIndex: highlightedIndexProp,
    onHighlightedIndexChange: onHighlightedIndexChangeProp,
    orientation,
    dense,
    itemSizes,
    loopFocus,
    cols,
    enableHomeAndEndKeys,
    onMapChange: onMapChangeProp,
    stopEventPropagation = true,
    rootRef,
    disabledIndices,
    modifierKeys,
    highlightItemOnHover = false,
    tag = 'div',
    ...elementProps
  } = componentProps;

  const direction = useDirection();

  const {
    props: defaultProps,
    highlightedIndex,
    onHighlightedIndexChange,
    elementsRef,
    onMapChange: onMapChangeUnwrapped,
    relayKeyboardEvent,
  } = useCompositeRoot({
    itemSizes,
    cols,
    loopFocus,
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

  const element = useRenderElement(tag, componentProps, {
    state,
    ref: refs,
    props: [defaultProps, ...props, elementProps],
    stateAttributesMapping,
  });

  const contextValue: CompositeRootContext = React.useMemo(
    () => ({
      highlightedIndex,
      onHighlightedIndexChange,
      highlightItemOnHover,
      relayKeyboardEvent,
    }),
    [highlightedIndex, onHighlightedIndexChange, highlightItemOnHover, relayKeyboardEvent],
  );

  return (
    <CompositeRootContext.Provider value={contextValue}>
      <CompositeList<Metadata>
        elementsRef={elementsRef}
        onMapChange={(newMap) => {
          onMapChangeProp?.(newMap);
          onMapChangeUnwrapped(newMap);
        }}
      >
        {element}
      </CompositeList>
    </CompositeRootContext.Provider>
  );
}

export interface CompositeRootProps<Metadata, State extends Record<string, any>>
  extends Pick<BaseUIComponentProps<'div', State>, 'render' | 'className' | 'children'> {
  props?: Array<Record<string, any> | (() => Record<string, any>)>;
  state?: State;
  stateAttributesMapping?: StateAttributesMapping<State>;
  refs?: React.Ref<HTMLElement | null>[];
  tag?: keyof React.JSX.IntrinsicElements;
  orientation?: 'horizontal' | 'vertical' | 'both';
  cols?: number;
  loopFocus?: boolean;
  highlightedIndex?: number;
  onHighlightedIndexChange?: (index: number) => void;
  itemSizes?: Dimensions[];
  dense?: boolean;
  enableHomeAndEndKeys?: boolean;
  onMapChange?: (newMap: Map<Node, CompositeMetadata<Metadata> | null>) => void;
  stopEventPropagation?: boolean;
  rootRef?: React.RefObject<HTMLElement | null>;
  disabledIndices?: number[];
  modifierKeys?: ModifierKey[];
  highlightItemOnHover?: boolean;
}

export namespace CompositeRoot {
  export type Props<Metadata, State extends Record<string, any>> = CompositeRootProps<
    Metadata,
    State
  >;
}
