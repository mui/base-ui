import type { InternalTreeItemCollection } from '../items/itemCollection';

export function requireItemWriter<Writer>(
  writer: Writer | undefined,
  option: 'setChildren',
  operation: string,
): Writer {
  if (writer === undefined) {
    throw new Error(
      `Base UI: ${operation} tried to update a custom item, but the item collection does not define the ${option} option, so the source model cannot be updated safely. Provide ${option} to Tree.createItems(). See https://base-ui.com/react/components/tree#createitems`,
    );
  }
  return writer;
}

/** Rebuilds `item` with `children` through the collection's `setChildren` writer. */
export function writeItemChildren<TItem>(
  collection: InternalTreeItemCollection<TItem>,
  item: TItem,
  children: readonly TItem[],
  operation: string,
): TItem {
  return requireItemWriter(collection.setItemChildren, 'setChildren', operation)(item, children);
}
