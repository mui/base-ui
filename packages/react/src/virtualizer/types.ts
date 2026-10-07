import type * as React from 'react';
import type { HTMLProps } from '../internals/types';

export interface VirtualizerItemMetrics {
  /**
   * The scroll position at which the item's start edge meets the start of the scrollport's
   * content box, so it can be passed straight to `scrollTo`. Logical: it includes estimates for
   * items that have not been measured yet, and it accounts for the scrollport's block padding.
   */
  offset: number;
  /**
   * Logical item size, including estimates for items that have not been measured yet.
   */
  size: number;
}

export type VirtualizerScrollAlignment = 'auto' | 'center' | 'end' | 'start';

export interface VirtualizerScrollToIndexOptions {
  /**
   * Where to place the item in the scrollport. `auto` only scrolls when the item is outside the
   * visible area.
   * @default 'auto'
   */
  align?: VirtualizerScrollAlignment | undefined;
  /**
   * Inset in pixels at the end edge of the scrollport that the item is kept clear of, for this
   * scroll alone. Overrides the scrollport's `scroll-padding-bottom`, for an overlay whose height
   * depends on the item being scrolled to rather than being fixed in CSS.
   * @default the scrollport's computed `scroll-padding-bottom`
   */
  paddingEnd?: number | undefined;
  /**
   * Inset in pixels at the start edge of the scrollport that the item is kept clear of, for this
   * scroll alone. Overrides the scrollport's `scroll-padding-top`, for an overlay whose height
   * depends on the item being scrolled to rather than being fixed in CSS — a tree pinning the
   * ancestors of the row it scrolls to, say.
   * @default the scrollport's computed `scroll-padding-top`
   */
  paddingStart?: number | undefined;
}

/**
 * Imperative actions exposed by the `Virtualizer` component.
 */
export interface VirtualizerActions {
  /**
   * Returns the index of the item a scroll position lands on, or `null` when the collection has
   * no items. Inverse of `getItemMetrics`, for answering the question without mounting the items
   * in between. A position inside an item is that item's. In a grouped collection a position
   * inside a group header belongs to the group's first item, or, for an empty group, to the next
   * item in the collection — the last item when nothing follows.
   */
  getIndexAtOffset: (offset: number) => number | null;
  /**
   * Returns the logical geometry of an item, including when it is outside the rendered window, or
   * `null` when the index is outside the collection.
   */
  getItemMetrics: (index: number) => VirtualizerItemMetrics | null;
  /**
   * Discards the item heights measured so far, so they are taken again against the layout the
   * items are in now. Call it after a change that resizes items without changing the collection,
   * such as crossing a layout breakpoint: items on screen resize on their own, while the heights
   * cached for the rest describe the layout they were last measured in. The scroll position is
   * kept, which is what remounting the virtualizer to clear them loses.
   */
  remeasure: () => void;
  /**
   * Scrolls an item into view by its logical collection index.
   */
  scrollToIndex: (index: number, options?: VirtualizerScrollToIndexOptions) => void;
}

/**
 * An activation of an item, describing what should happen to the viewport along with it.
 *
 * Scrolling responds to the activation rather than to the resulting state: the same item can be
 * activated by a keypress that should bring it into view, or by the pointer already resting on it,
 * which must not move the list. Both facts arrive together so they cannot drift apart.
 */
export interface VirtualizerActiveItem {
  /**
   * Where to place the item in the scrollport. `auto` only scrolls when the item is outside the
   * visible area.
   * @default 'auto'
   */
  align?: VirtualizerScrollAlignment | undefined;
  /**
   * Index of the item in the collection.
   */
  index: number;
  /**
   * Inset in pixels at the end edge of the scrollport that the item is kept clear of, for the
   * scroll this activation describes. Overrides the scrollport's `scroll-padding-bottom`.
   * @default the scrollport's computed `scroll-padding-bottom`
   */
  paddingEnd?: number | undefined;
  /**
   * Inset in pixels at the start edge of the scrollport that the item is kept clear of, for the
   * scroll this activation describes. Overrides the scrollport's `scroll-padding-top`, for an
   * overlay whose height depends on the item being activated rather than being fixed in CSS.
   * @default the scrollport's computed `scroll-padding-top`
   */
  paddingStart?: number | undefined;
  /**
   * Whether this activation scrolls the item into view.
   * @default true
   */
  scroll?: boolean | undefined;
}

/**
 * The active item, as an index alone or as an activation that also describes the scroll it wants.
 */
export type VirtualizerActiveIndex = number | VirtualizerActiveItem;

/**
 * A group in a grouped collection: an object with an `items` array, and anything else the
 * group's header needs.
 *
 * Deliberately just `items`: the list components' `Group` type carries an index signature that a
 * consumer's own `interface` for a group is not assignable to, and the virtualizer takes the
 * consumer's type as given.
 */
export interface VirtualizerGroup<Item> {
  items: ReadonlyArray<Item>;
}

// An alias under a name of its own: the API reference takes a function returning a type named
// `ReactElement` for a component and documents its first parameter as props, which would hide
// the renderer's other parameters.
/**
 * A `React.ReactElement`, as returned by a group header renderer.
 */
export type VirtualizerGroupHeaderElement = React.ReactElement;

// The three group callbacks are declared through method signatures so the group parameter is
// bivariant: a consumer annotates it with their own group type — narrower than
// `VirtualizerGroup`, whose `items` is all the virtualizer knows about — and that must be
// accepted. Spelled out per callback rather than through a shared helper, so the API reference
// renders each parameter.
/**
 * Renders the element carrying a group's name. Annotate `group` with your own group type to read
 * anything beyond its `items`.
 */
export type VirtualizerRenderGroupHeader<Value> = {
  bivarianceHack(
    group: VirtualizerGroup<Value>,
    groupIndex: number,
    headerProps: VirtualizerGroupHeaderProps,
  ): VirtualizerGroupHeaderElement;
}['bivarianceHack'];

/**
 * Returns a stable key for a group. Annotate `group` with your own group type to read anything
 * beyond its `items`.
 */
export type VirtualizerGetGroupKey<Value> = {
  bivarianceHack(group: VirtualizerGroup<Value>): string | number;
}['bivarianceHack'];

/**
 * Estimates a group header's height before it has been measured. Annotate `group` with your own
 * group type to read anything beyond its `items`.
 */
export type VirtualizerEstimateGroupHeaderHeight<Value> = {
  bivarianceHack(group: VirtualizerGroup<Value>, groupIndex: number): number;
}['bivarianceHack'];

/**
 * Attributes applied to the element that carries a group's name.
 *
 * The group itself is named through `aria-labelledby`, so the element is hidden from assistive
 * technology: a listbox may only own options, and a bare heading would be an invalid child.
 */
export interface VirtualizerGroupHeaderProps extends VirtualizerRowProps {
  /**
   * The id the group's wrapper references. `undefined` only on React 17, during the first
   * render, until the client-side id is assigned; the wrapper's reference is withheld with it.
   */
  id: string | undefined;
  'aria-hidden': true;
}

/**
 * Metadata provided to a group header rendered by the virtualizer, for a list's own group label
 * to pick up through the list's context.
 */
export interface VirtualizerGroupHeaderMetadata {
  /**
   * The id the group's wrapper references through `aria-labelledby`. `undefined` only on React 17
   * during the first render, before the client-side id is assigned.
   */
  id: string | undefined;
  /** Index of the group in the grouped collection. */
  groupIndex: number;
}

/**
 * Attributes that bind a row element to the virtualizer, for a layout in which the element a
 * renderer returns is the row itself rather than the content of a wrapper the virtualizer renders.
 * They are spread onto that element along with the row's other metadata.
 */
export interface VirtualizerRowProps {
  /**
   * Measures the row. A row outside the rendered window that is kept mounted for the focus it
   * holds is not measured, and carries no ref.
   */
  ref?: React.RefCallback<HTMLElement> | undefined;
  /**
   * Index of the row in the virtualizer's row sequence, which group headers are part of.
   */
  'data-row-index'?: number | undefined;
  /**
   * Removes a row kept mounted outside the rendered window from the layout, while keeping the
   * focus it holds. Merge it with any style of your own rather than replacing it.
   */
  style?: React.CSSProperties | undefined;
}

/**
 * Which ARIA the virtualizer states for an item's position in its collection.
 *
 * - `set`: `aria-posinset` and `aria-setsize` describing the item's place in the flat collection,
 *   which is what a listbox's options need.
 * - `none`: neither, for a collection whose items state their position relative to something
 *   else — a tree, whose items are placed among their siblings, or a grid, whose cells are placed
 *   by row and column. The rest of the metadata is unaffected, so the consumer supplies its own
 *   ARIA next to it.
 */
export type VirtualizerItemAria = 'none' | 'set';

/**
 * Accessibility and collection metadata for a virtualized item.
 *
 * A list's own `<Item>` applies these itself. Items rendered without one receive them as the third
 * argument of the item renderer, to spread onto the element that represents the item.
 *
 * In the table layout, that element is the row the virtualizer measures and positions, so these
 * also carry the row's `ref`, its `data-row-index`, and the `style` that keeps a row mounted
 * outside the window out of the layout.
 *
 * `aria-posinset` and `aria-setsize` are present unless `itemAria` declines them.
 */
export type VirtualizerItemProps = HTMLProps &
  VirtualizerRowProps & {
    /** Logical index exposed as a DOM data attribute. */
    'data-index': number;
  };

/**
 * Metadata provided to an item rendered by the virtualizer.
 */
export interface VirtualizerItemMetadata {
  /** Logical index in the full collection. */
  index: number;
  /** Accessibility and collection metadata applied to the item. */
  props: VirtualizerItemProps;
  /** Registers the item rendered for this virtual row. */
  registerItem: (() => () => void) | undefined;
}
