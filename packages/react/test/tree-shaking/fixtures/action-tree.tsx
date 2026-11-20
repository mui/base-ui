import * as React from 'react';
import { ActionTree } from '../../../src/action-tree';

export function App() {
  return (
    <ActionTree.Root defaultItems={[]}>
      <ActionTree.List>
        {(item) => (
          <ActionTree.Item itemId={item.id}>
            <ActionTree.ItemContent>
              <ActionTree.ItemCheckbox />
              {item.label}
              <ActionTree.ItemButton>Info</ActionTree.ItemButton>
            </ActionTree.ItemContent>
          </ActionTree.Item>
        )}
      </ActionTree.List>
    </ActionTree.Root>
  );
}
