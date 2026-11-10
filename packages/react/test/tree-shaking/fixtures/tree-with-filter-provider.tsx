import * as React from 'react';
import { Tree } from '../../../src/tree';

export function App() {
  return (
    <Tree.FilterProvider>
      <Tree.Root defaultItems={[]}>
        <Tree.Input aria-label="Filter" />
        <Tree.Clear />
        <Tree.List>{(item) => <Tree.Item itemId={item.id}>{item.label}</Tree.Item>}</Tree.List>
        <Tree.Empty />
      </Tree.Root>
    </Tree.FilterProvider>
  );
}
