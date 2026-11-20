import * as React from 'react';
import { Tree } from '../../../src/tree';

export function App() {
  return (
    <Tree.Root defaultItems={[]}>
      <Tree.List>
        {(item) => (
          <Tree.CheckboxItem itemId={item.id}>
            <Tree.CheckboxItemIndicator />
            {item.label}
          </Tree.CheckboxItem>
        )}
      </Tree.List>
      <Tree.Empty />
    </Tree.Root>
  );
}
