import { useStore } from '@base-ui/utils/store';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { resolveRenderedId } from '../../internals/resolveRenderedId';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useWarnMisplacedTreeRootFeatures } from '../root/TreeRootFeatures';
import { selectors } from '../store/selectors';
import { useIsTreeEmpty } from './useIsTreeEmpty';

/**
 * Returns the DOM props and ref that should be applied to the element
 * with `role="treegrid"`.
 *
 * @param props The list's `id` and `render` props.
 */
export function useTreeRootProps(props: { id?: string | undefined; render?: unknown }) {
  const store = useTreeRootContext();
  useWarnMisplacedTreeRootFeatures();

  // A filterable tree needs an id for `Tree.Input` to reference.
  const generatedId = useBaseUiId(props.id);
  const id = store.filtering == null ? props.id : generatedId;
  // An empty id on the `render` element leaves the list without one to reference.
  store.useSyncedValueWithCleanup('listId', resolveRenderedId(props, id) || undefined);

  const selectionMode = useStore(store, (s) => s.selectionMode);
  const disabled = useStore(store, (s) => s.disabled);
  const empty = useIsTreeEmpty();
  const labelId = useStore(store, (s) => s.labelId);
  // Not the tabbable id itself, so moving focus between rows does not
  // re-render the whole list.
  const containerFocus = useStore(store, (s): 'tab-stop' | 'focusable' | 'none' => {
    if (selectors.tabbableItemId(s) != null) {
      return 'none';
    }
    // A disabled tree without a focusable row leaves the tab order. It stays
    // focusable to hold the focus of a row that just became disabled.
    return s.disabled ? 'focusable' : 'tab-stop';
  });
  let tabIndex: number | undefined;
  if (containerFocus === 'tab-stop') {
    tabIndex = 0;
  } else if (containerFocus === 'focusable') {
    tabIndex = -1;
  }

  const rootProps = {
    id,
    role: 'treegrid',
    'aria-labelledby': labelId,
    'aria-multiselectable': (selectionMode === 'multiple' || undefined) as true | undefined,
    'aria-disabled': disabled || undefined,
    // The roving tab stop normally lives on a row. The container takes it when
    // there is no focusable row.
    tabIndex,
    ...store.interaction.rootEventHandlers,
  };

  const rootRef = useRefWithInit(() => (node: HTMLElement | null) => {
    store.context.rootRef.current = node;
  }).current;

  return { rootProps, rootRef, state: { disabled, empty } };
}
