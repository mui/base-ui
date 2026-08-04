'use client';
import * as React from 'react';
import type { ListVirtualizationRegistry } from './ListVirtualizationRegistry';
import type { ListVirtualizerItemMetadata } from './types';

/**
 * Stable wiring published by a list component so `<ListVirtualizer>` can bind to it.
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
  virtualItemContext: React.Context<ListVirtualizerItemMetadata | undefined>;
  /**
   * Warns about configurations the list cannot window, in its own vocabulary. Called once while a
   * virtualizer is mounted, so a list that can be windowed says nothing. Development only.
   */
  warnUnsupportedConfiguration?: (() => void) | undefined;
}

/**
 * Reactive list state the virtualizer windows against. Only `<ListVirtualizer>` subscribes to it.
 *
 * Deliberately limited to flat collections: any list whose rows are a single ordered sequence can
 * implement it, while hierarchical collections need a virtualizer of their own.
 */
export interface ListVirtualizationListState {
  /**
   * Index of the active item, or `null` when none is active. The virtualizer keeps this row
   * mounted even when it falls outside the rendered window.
   */
  activeIndex: number | null;
  /**
   * The flat, ordered collection to window.
   */
  items: ReadonlyArray<unknown>;
  /**
   * Whether the list temporarily needs every item mounted, such as while collecting rendered
   * labels for browser autofill.
   */
  renderAllRows: boolean;
  /**
   * Version incremented after a temporary render-all pass. Changing it restores the constrained
   * client height as the virtualizer viewport, including when the component remounts.
   */
  renderAllRowsRestoreVersion: number;
  /**
   * Whether the active item should be scrolled into view. Lists that highlight on hover pass
   * `false` for pointer-driven changes, which would otherwise move the list under the cursor.
   */
  scrollActiveIntoView: boolean;
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
 * Returns the surrounding list's virtualization host and state, throwing outside of a list.
 */
export function useListVirtualization() {
  const host = React.useContext(ListVirtualizationHostContext);
  const listState = React.useContext(ListVirtualizationListStateContext);

  if (!host || !listState) {
    throw new Error(
      'Base UI: <ListVirtualizer> was rendered outside of a list that supports virtualization. ' +
        'It reads the collection and highlight state from the surrounding list, so it cannot ' +
        'render on its own. Place it inside <Combobox.List>. ' +
        'Documentation: https://base-ui.com/react/utils/list-virtualizer',
    );
  }

  return { host, listState };
}
