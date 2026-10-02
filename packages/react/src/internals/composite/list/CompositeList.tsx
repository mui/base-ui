'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { CompositeListContext } from './CompositeListContext';
import type { CompositeListContextValue } from './CompositeListContext';
import { CompositeListRegistry } from './CompositeListRegistry';
import type { CompositeListRegistryParameters } from './CompositeListRegistry';

export type { CompositeMetadata } from './CompositeListRegistry';

/**
 * Tracks the items registered through the returned context and keeps `elementsRef` and
 * `labelsRef` ordered by index. Render the value with `CompositeListContext.Provider`.
 */
export function useCompositeList<Metadata>(
  params: UseCompositeListParameters<Metadata>,
): CompositeListContextValue<Metadata> {
  const { elementsRef, labelsRef, onMapChange } = params;

  const [, requestFlush] = React.useReducer(increment, 0);
  const list = useRefWithInit(
    () => new CompositeListRegistry<Metadata>({ elementsRef, labelsRef, requestFlush }),
  ).current;

  // Item refs attach before this effect runs, so flushing here rebuilds the refs before paint
  // and while the originating React event is still inside `act()` in tests.
  useIsoLayoutEffect(() => {
    list.onMapChange = onMapChange;
    list.setRefs(elementsRef, labelsRef);

    if (list.dirty) {
      list.flush();
    }
  });

  useIsoLayoutEffect(() => () => list.dispose(), [list]);

  return list.context;
}

/**
 * Provides context for a list of items in a composite component.
 */
export function CompositeList<Metadata>(props: CompositeList.Props<Metadata>) {
  const context = useCompositeList(props);

  return (
    <CompositeListContext.Provider value={context}>{props.children}</CompositeListContext.Provider>
  );
}

function increment(count: number) {
  return count + 1;
}

export interface CompositeListState {}

export interface UseCompositeListParameters<Metadata> extends Omit<
  CompositeListRegistryParameters<Metadata>,
  'requestFlush'
> {}

export interface CompositeListProps<Metadata> extends UseCompositeListParameters<Metadata> {
  children: React.ReactNode;
}

export namespace CompositeList {
  export type State = CompositeListState;
  export type Props<Metadata> = CompositeListProps<Metadata>;
}
