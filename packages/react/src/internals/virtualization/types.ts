import type * as React from 'react';
import type { VirtualizerRowProps } from '../../virtualizer/types';

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
