import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { TreeItemId } from '../store/types';

import { selectors } from '../store/selectors';
import type { TreeStore } from '../store/TreeStore';

export const TreeItemModelProvider = React.memo(function TreeItemModelProvider(props: {
  store: TreeStore<any, any>;
  itemId: TreeItemId;
  children: (item: any) => React.ReactNode;
}) {
  const model = useStore(props.store, selectors.itemModel, props.itemId);
  return props.children(model) as React.JSX.Element;
});
