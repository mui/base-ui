import { IndexableMap } from '../utils/IndexableMap';

export interface RegisterItemReturnValue {
  /**
   * A function that deregisters the item.
   */
  deregister: () => void;
}

export type WithRef = { ref: React.RefObject<Node> };

export interface CompoundParentContextValue<Key, Subitem extends WithRef> {
  /**
   * Registers an item with the parent.
   * This should be called during the effect phase of the child component.
   * The `itemMetadata` should be a stable reference (for example a memoized object), to avoid unnecessary re-registrations.
   *
   * @param key Key of the item or a function that generates a unique key for the item.
   *   It is called with the set of the keys of all the items that have already been registered.
   *   Return `existingKeys.size` if you want to use the index of the new item as the id.
   * @param itemMetadata Arbitrary metadata to pass to the parent component.
   */
  registerItem: (key: Key | undefined, item: Subitem) => RegisterItemReturnValue;
  /**
   * Returns a number of items that were registered with the parent.
   * This number may be different from `subitems.size` during the effect phase, as `subitems` are kept in state and are updated less frequently.
   * This value is useful for generating unique keys for the items.
   */
  getRegisteredItemCount: () => number;
}

export interface UseCompoundParentReturnValue<Key, Subitem extends WithRef> {
  context: CompoundParentContextValue<Key, Subitem>;
  /**
   * The subitems registered with the parent.
   * The key is the id of the subitem, and the value is the metadata passed to the `useCompoundItem` hook.
   * The order of the items is the same as the order in which they were registered.
   */
  subitems: IndexableMap<Key, Subitem>;
}

export interface UseCompoundItemParameters<Key, Subitem extends WithRef> {
  key: Key | undefined;
  keyGenerator?: (registeredItemsCount: number) => Key;
  itemMetadata: Subitem;
  parentContext: CompoundParentContextValue<Key, Subitem>;
}

export interface UseCompoundItemReturnValue<Key> {
  key: Key | undefined;
}
