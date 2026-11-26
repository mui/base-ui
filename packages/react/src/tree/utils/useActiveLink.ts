'use client';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { TreeStore } from '../store/TreeStore';
import type { TreeItemId } from '../store/types';

/**
 * Marks an item as linking to the current page while `active`. The item then
 * carries `aria-current="page"`, and takes the tree's tab stop when no item is
 * selected and no other item had focus.
 */
export function useActiveLink(store: TreeStore<any, any>, itemId: TreeItemId, active: boolean) {
  useIsoLayoutEffect(() => {
    if (!active) {
      return undefined;
    }
    store.updateItemCount('activeLinkCounts', itemId, 1);
    return () => store.updateItemCount('activeLinkCounts', itemId, -1);
  }, [active, store, itemId]);
}
