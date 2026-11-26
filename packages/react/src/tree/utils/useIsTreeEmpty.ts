import { useStore } from '@base-ui/utils/store';
import { useTreeRootContext } from '../root/TreeRootContext';
import { selectors } from '../store/selectors';

/** Whether the tree has no visible rows, or no item matches the filter. */
export function useIsTreeEmpty(): boolean {
  const store = useTreeRootContext();
  return useStore(
    store,
    (state) =>
      selectors.flatList(state).length === 0 || store.filtering?.hasNoMatches(state) === true,
  );
}
