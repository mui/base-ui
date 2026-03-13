import { useStore } from '@base-ui/utils/store';
import { useTreeRootContext } from './TreeRootContext';
import { selectors, type VisibleItem } from '../store/selectors';

/**
 * Returns the visible items in the tree, respecting the current expansion state.
 * Use this hook inside a `Tree.Root` with `virtualized` to get the flat list
 * of items that should be rendered.
 */
export function useVisibleItems(): VisibleItem[] {
  const store = useTreeRootContext();
  return useStore(store, selectors.visibleItems);
}

export namespace useVisibleItems {
  export type Item = VisibleItem;
}
