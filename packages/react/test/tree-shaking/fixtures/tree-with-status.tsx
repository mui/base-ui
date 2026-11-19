import * as React from 'react';
import { Tree } from '../../../src/tree';

export function App() {
  return (
    <Tree.Root defaultItems={[]}>
      <Tree.List>{(item) => <Tree.Item itemId={item.id}>{item.label}</Tree.Item>}</Tree.List>
      <Tree.Status />
    </Tree.Root>
  );
}
