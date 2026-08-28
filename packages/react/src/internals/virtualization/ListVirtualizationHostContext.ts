'use client';
import * as React from 'react';
import type { ListVirtualizationRegistry } from './ListVirtualizationRegistry';
import type { VirtualizerItemMetadata } from './types';

/**
 * Stable wiring published by a list component so `<Virtualizer>` can bind to it.
 *
 * Kept free of reactive state: `<Item>` reads this context to detect that it is inside a list, so a
 * changing value here would re-render every item on each highlight change.
 */
export interface ListVirtualizationHost {
  /**
   * Part namespace of the owning list, used to reference the right parts in diagnostics
   * (`Combobox` produces `<Combobox.Root>`, `<Combobox.Item>`, and so on).
   */
  componentName: string;
  /**
   * Coordinates virtualized and non-virtualized content rendered by the list.
   */
  registry: ListVirtualizationRegistry;
  /**
   * Channel the list's `<Item>` reads its collection and accessibility metadata from.
   */
  virtualItemContext: React.Context<VirtualizerItemMetadata | undefined>;
  /**
   * Warns about configurations the list cannot window, in its own vocabulary. Called once while a
   * virtualizer is mounted, so a list that can be windowed says nothing. Development only.
   */
  warnUnsupportedConfiguration?: (() => void) | undefined;
}

/**
 * Reactive list state the virtualizer windows against. Only `<Virtualizer>` subscribes to it.
 *
 * Deliberately limited to flat collections: any list whose rows are a single ordered sequence can
 * implement it, while hierarchical collections need a virtualizer of their own.
 */
export interface ListVirtualizationListState {
  /**
   * Index of the item the list currently points at, or `null` when it points at none. The
   * virtualizer keeps that row mounted even when it falls outside the rendered window, so it can
   * hold focus or be referenced by `aria-activedescendant`.
   */
  activeIndex: number | null;
  /**
   * The flat, ordered collection to window.
   */
  items: ReadonlyArray<unknown>;
  /**
   * Whether the active item should be scrolled into view. Lists that also point at items with the
   * pointer pass `false` for those, since scrolling would move the list under the cursor.
   */
  scrollActiveIntoView: boolean;
  /**
   * Whether the list currently needs every item mounted, which suspends windowing for as long as
   * it is `true`. A list that never needs this omits the field.
   *
   * The virtualizer measures its viewport while windowed, so a suspension invalidates that
   * measurement: a scrollport constrained only by a maximum height grows to fit the whole
   * collection, and the observer reports the expanded box. It re-measures when this returns to
   * `false`, which means the list **must clear it while the virtualizer is still mounted**. A list
   * that unmounts the virtualizer first — by releasing whatever kept the list rendered — loses the
   * transition and leaves the engine sizing its window from a viewport that no longer exists.
   */
  windowingSuspended?: boolean | undefined;
}

export const ListVirtualizationHostContext = React.createContext<
  ListVirtualizationHost | undefined
>(undefined);

export const ListVirtualizationListStateContext = React.createContext<
  ListVirtualizationListState | undefined
>(undefined);

/**
 * Returns the surrounding list's virtualization host, or `undefined` outside of a supported list.
 */
export function useListVirtualizationHost() {
  return React.useContext(ListVirtualizationHostContext);
}

/**
 * Returns the surrounding list's virtualization host and state, if there is one.
 *
 * A virtualizer given its own collection through the `items` prop renders without a list, so this
 * only throws when neither source is available.
 */
export function useListVirtualization(hasOwnCollection: boolean) {
  const host = React.useContext(ListVirtualizationHostContext);
  const listState = React.useContext(ListVirtualizationListStateContext);

  if (!hasOwnCollection && (!host || !listState)) {
    throw new Error(
      'Base UI: <Virtualizer> was rendered without an `items` prop and outside of a list ' +
        'that supports virtualization, so it has no collection to render. Pass `items`, or ' +
        'place it inside <Combobox.List> to window that list. ' +
        'Documentation: https://base-ui.com/react/utils/virtualizer',
    );
  }

  return { host, listState };
}
