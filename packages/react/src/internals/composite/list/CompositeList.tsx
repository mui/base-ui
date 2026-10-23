'use client';
import * as React from 'react';
import { useForcedRerendering } from '@base-ui/utils/useForcedRerendering';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { CompositeListContext } from './CompositeListContext';
import type { CompositeListContextValue } from './CompositeListContext';
import { CompositeListModel } from './CompositeListModel';
import type { CompositeListModelParameters } from './CompositeListModel';

export type { CompositeMetadata } from './CompositeListModel';

/**
 * Tracks the items registered through the returned context and keeps `elementsRef` and
 * `labelsRef` ordered by index. Render the value with `CompositeListContext.Provider`.
 */
export function useCompositeList<Metadata>(
  params: UseCompositeListParameters<Metadata>,
): CompositeListContextValue<Metadata> {
  const { elementsRef, labelsRef, onMapChange } = params;

  const requestFlush = useForcedRerendering();
  const list = useRefWithInit(
    () => new CompositeListModel<Metadata>({ elementsRef, labelsRef, requestFlush }),
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

export interface CompositeListState {}

export interface UseCompositeListParameters<Metadata> extends Omit<
  CompositeListModelParameters<Metadata>,
  'requestFlush'
> {}

export interface CompositeListProps<Metadata> extends UseCompositeListParameters<Metadata> {
  children: React.ReactNode;
}

export namespace CompositeList {
  export type State = CompositeListState;
  export type Props<Metadata> = CompositeListProps<Metadata>;
}
