'use client';
import * as React from 'react';
import type {
  VirtualizerActiveIndex,
  VirtualizerGroup,
  VirtualizerGroupHeaderMetadata,
  VirtualizerItemAria,
  VirtualizerItemMetadata,
  VirtualizerItemMetrics,
  VirtualizerScrollToIndexOptions,
} from './types';

/**
 * Imperative operations a virtualizer exposes to the component hosting it.
 */
export interface VirtualizerHandle {
  /**
   * Returns the index of the last item starting at or before the given scroll position.
   */
  getIndexAtOffset: (offset: number) => number | null;
  /**
   * Returns the logical geometry for an item, including when it is outside the rendered window.
   */
  getItemMetrics: (index: number) => VirtualizerItemMetrics | null;
  /**
   * Scrolls an item into view by its logical collection index.
   */
  scrollToIndex: (index: number, options?: VirtualizerScrollToIndexOptions) => void;
  /**
   * Discards measured item heights so they are taken again against the current layout.
   */
  remeasure: () => void;
  /**
   * Resets the virtualizer's scroll position to the start of the list.
   */
  resetScroll: () => void;
}

/**
 * A virtualizer registered with its host: its imperative operations, plus the state the host
 * needs to tell which behaviors the virtualizer currently owns.
 */
export interface VirtualizerRegistration extends VirtualizerHandle {
  /**
   * Whether the virtualizer is currently mounting a window of rows and owning the scroll position.
   * A disabled virtualizer renders the whole collection and behaves like a plain scrolling list.
   */
  enabled: boolean;
}

/**
 * Coordinates virtualized and non-virtualized content rendered by a single host.
 */
export interface VirtualizerRegistry {
  /**
   * Number of non-virtualized items currently registered with the host.
   */
  nonVirtualItemCount: number;
  /**
   * The registered virtualizer. A host supports at most one; the binding warns when more than one
   * registers.
   */
  virtualizer: VirtualizerRegistration | null;
}

/**
 * Creates the virtualization registry owned by a host's root.
 */
export function createVirtualizerRegistry(): VirtualizerRegistry {
  return {
    nonVirtualItemCount: 0,
    virtualizer: null,
  };
}

/**
 * Stable wiring published by a component so `<Virtualizer>` can window its collection.
 *
 * Kept free of reactive state: an `<Item>` reads this context to detect that it is inside a host,
 * so a changing value here would re-render every item on each highlight change. The collection and
 * the highlight travel through {@link VirtualizerHostState} instead.
 */
export interface VirtualizerHost {
  /**
   * Part namespace of the host, used to reference the right parts in diagnostics
   * (`Combobox` produces `<Combobox.Root>`, `<Combobox.Item>`, and so on).
   */
  componentName: string;
  /**
   * Which ARIA the host's items state for their position in the collection. `set` is the default:
   * `aria-posinset` and `aria-setsize` for the item's place in the flat collection, which is what
   * the options of a listbox need. A host whose items are placed relative to something else — the
   * items of a tree, placed among their siblings — publishes `none` and states the position
   * itself. The virtualizer's `itemAria` prop overrides whatever the host declares.
   */
  itemAria?: VirtualizerItemAria | undefined;
  /**
   * Coordinates virtualized and non-virtualized content rendered by the host.
   */
  registry: VirtualizerRegistry;
  /**
   * Channel the host's `<Item>` reads its collection and accessibility metadata from.
   */
  virtualItemContext: React.Context<VirtualizerItemMetadata | undefined>;
  /**
   * Channel the host's `<GroupLabel>` reads the id of the group header it is rendered in from.
   * A host without group parts omits it; its group headers then receive the same metadata as the
   * third argument of the header renderer.
   */
  virtualGroupContext?: React.Context<VirtualizerGroupHeaderMetadata | undefined> | undefined;
  /**
   * Warns about configurations the host cannot window, in its own vocabulary. Called once while a
   * virtualizer is mounted, so a host that can be windowed says nothing. Development only.
   */
  warnUnsupportedConfiguration?: (() => void) | undefined;
}

/**
 * Reactive state the virtualizer windows against. Only `<Virtualizer>` subscribes to it.
 *
 * The collection is always the flat, ordered sequence of items; a host that groups them publishes
 * the grouped view of that same sequence alongside, never instead. A hierarchy is published as the
 * sequence it is displayed as — a tree publishes its expanded rows in order — and the hierarchy
 * itself lives in the host's own item metadata, not in the collection's shape.
 */
export interface VirtualizerHostState {
  /**
   * The item the host currently points at, or `null` when it points at none. The virtualizer
   * keeps that row mounted even when it falls outside the rendered window, so it can hold focus
   * or be referenced by `aria-activedescendant`.
   *
   * An index alone is an activation that scrolls, as it is for the `activeIndex` prop. Publish
   * `{ index, scroll: false }` for an activation that must leave the viewport alone, such as a
   * highlight following the pointer, along with the `align`, `paddingStart` and `paddingEnd` the
   * scroll wants. Carrying the decision with the index is what keeps the two from disagreeing:
   * re-publishing an equal activation does not scroll again, and a highlight that stops following
   * the pointer cannot scroll to wherever the pointer last rested.
   */
  activeIndex: VirtualizerActiveIndex | null;
  /**
   * The grouped view of `items`: the same filtered collection, partitioned into groups in order,
   * so that the group item counts sum to `items.length`. Omitted by a host that is not grouped.
   */
  groups?: ReadonlyArray<VirtualizerGroup<unknown>> | undefined;
  /**
   * The flat, ordered collection to window.
   */
  items: ReadonlyArray<unknown>;
  /**
   * Whether the active item should be scrolled into view.
   *
   * @deprecated Publish the decision on `activeIndex` instead — `{ index, scroll: false }` for an
   * activation that must not move the viewport. This flag describes the host rather than the
   * change, so flipping it back to `true` without moving `activeIndex` scrolls to whatever was
   * pointed at last. It is read only for an `activeIndex` published as a bare index.
   */
  scrollActiveIntoView?: boolean | undefined;
  /**
   * Whether the host currently needs every item mounted, which suspends windowing for as long as
   * it is `true`. A host that never needs this omits the field.
   *
   * The virtualizer measures its viewport while windowed, so a suspension invalidates that
   * measurement: a scrollport constrained only by a maximum height grows to fit the whole
   * collection, and the observer reports the expanded box. It re-measures when this returns to
   * `false`, which means the host **must clear it while the virtualizer is still mounted**. A host
   * that unmounts the virtualizer first — by releasing whatever kept the list rendered — loses the
   * transition and leaves the engine sizing its window from a viewport that no longer exists.
   */
  windowingSuspended?: boolean | undefined;
}

export const VirtualizerHostContext = React.createContext<VirtualizerHost | undefined>(undefined);

export const VirtualizerHostStateContext = React.createContext<VirtualizerHostState | undefined>(
  undefined,
);

/**
 * Returns the surrounding host's virtualization wiring, or `undefined` outside of a host.
 */
export function useVirtualizerHost() {
  return React.useContext(VirtualizerHostContext);
}

/**
 * Returns the surrounding host's collection and highlight state, or `undefined` outside of a host.
 */
export function useVirtualizerHostState() {
  return React.useContext(VirtualizerHostStateContext);
}
