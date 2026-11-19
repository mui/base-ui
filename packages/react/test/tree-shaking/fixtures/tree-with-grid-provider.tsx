import * as React from 'react';
import { Tree } from '../../../src/tree';

export function App() {
  return (
    <Tree.GridProvider>
      <Tree.Root defaultItems={[]}>
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemContent>
                {item.label}
                <Tree.ItemButton>Info</Tree.ItemButton>
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>
    </Tree.GridProvider>
  );
}
