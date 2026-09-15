import type * as React from 'react';
import type { HTMLProps } from '../types';
import type { VirtualizerScrollAlignment } from './ListVirtualizationRegistry';

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
 * Row model built for each item in the list's filtered collection.
 */
export interface VirtualizerItemRowModel<Item> {
  item: Item;
  itemIndex: number;
}

/**
 * Row model of a group header, the row that precedes a group's items.
 *
 * It carries no reference to the group object: a list recreates its group objects on every
 * filter pass, and rows that compared group identity would be rebuilt — and the engine's geometry
 * rehydrated — on every keystroke that leaves the results unchanged. The renderer reads the current
 * group by index instead, so a header showing the group's item count is never stale either.
 */
export interface VirtualizerGroupHeaderRowModel {
  kind: 'group-header';
  groupIndex: number;
  /**
   * Index of the group's first item. Equals the item count for an empty trailing group.
   */
  itemStart: number;
  /**
   * A small integer that follows the group's key for the virtualizer's lifetime, so an id can be
   * built from the key without carrying its characters.
   */
  ordinal: number;
}

/**
 * Any row the virtualizer windows: an item, or a group header.
 */
export type VirtualizerRowModel<Item> =
  VirtualizerItemRowModel<Item> | VirtualizerGroupHeaderRowModel;

export function isGroupHeaderRow<Item>(
  model: VirtualizerRowModel<Item>,
): model is VirtualizerGroupHeaderRowModel {
  return (model as VirtualizerGroupHeaderRowModel).kind === 'group-header';
}

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
 * A row measured and windowed by the virtualizer.
 */
export interface VirtualizerRow<RowModel> {
  /**
   * Stable identity used by React and the measurement cache.
   */
  id: React.Key;
  /**
   * Data associated with the row.
   */
  model: RowModel;
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
 * Parameters provided when rendering a row.
 */
export interface VirtualizerRenderRowParameters<RowModel> {
  /**
   * The row being rendered.
   */
  row: VirtualizerRow<RowModel>;
  /**
   * Index in the virtual row collection.
   */
  rowIndex: number;
  /**
   * Attributes to apply to the row element itself, when the virtualizer renders no wrapper of
   * its own around the row. Reach the element through the renderer's metadata argument.
   */
  rowProps?: VirtualizerRowProps | undefined;
}

/**
 * Accessibility and collection metadata for a virtualized item.
 *
 * A list's own `<Item>` applies these itself. Items rendered without one receive them as the third
 * argument of the item renderer, to spread onto the element that represents the item.
 *
 * In the table layout, that element is the row the virtualizer measures and positions, so these
 * also carry the row's `ref`, its `data-row-index`, and the `style` that keeps a row mounted
 * outside the window out of the layout.
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
