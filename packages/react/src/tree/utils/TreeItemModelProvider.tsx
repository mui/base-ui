import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { TreeItemContext, type TreeItemContextValue } from '../item/TreeItemContext';
import { selectors } from '../store/selectors';
import type { TreeItemId, TreeItemModel } from '../store/types';
import type { TreeStore } from '../store/TreeStore';

export function TreeItemModelProvider(props: {
  store: TreeStore;
  itemId: TreeItemId;
  children: (item: TreeItemModel) => React.ReactNode;
}) {
  const model = useStore(props.store, selectors.itemModel, props.itemId);
  const contextValue: TreeItemContextValue = React.useMemo(
    () => ({ itemId: props.itemId }),
    [props.itemId],
  );
  return (
    <TreeItemContext.Provider value={contextValue}>
      {props.children(model)}
    </TreeItemContext.Provider>
  );
}
