import * as React from 'react';
import { TreeGrid } from '../../../src/tree-grid';

export function App() {
  return (
    <TreeGrid.Root defaultItems={[]}>
      <TreeGrid.Table>
        {(item) => (
          <TreeGrid.Row itemId={item.id}>
            <TreeGrid.Cell>
              <TreeGrid.RowCheckbox />
              {item.label}
              <TreeGrid.CellButton>Info</TreeGrid.CellButton>
            </TreeGrid.Cell>
          </TreeGrid.Row>
        )}
      </TreeGrid.Table>
    </TreeGrid.Root>
  );
}
