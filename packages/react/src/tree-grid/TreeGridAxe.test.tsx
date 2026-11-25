import * as React from 'react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';
import { TreeGrid } from '.';

const items: TreeGrid.DefaultItem[] = [
  {
    id: 'documents',
    label: 'Documents',
    children: [
      { id: 'resume', label: 'Resume.pdf' },
      { id: 'invoices', label: 'Invoices', children: [{ id: 'q1', label: 'Invoice Q1.pdf' }] },
    ],
  },
  { id: 'notes', label: 'Notes.txt' },
];

function formatViolation(violation: axe.Result) {
  const targets = violation.nodes.map((node) => node.target.join(' ')).join(', ');
  return `${violation.id}: ${violation.help} (${targets})`;
}

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, { resultTypes: ['violations'] });
  expect(results.violations.map(formatViolation)).toEqual([]);
}

// Each test checks that the tree reached the state under test before running axe on it.
describe.skipIf(isJSDOM)('TreeGrid axe checks', () => {
  const { render } = createRenderer();

  it('item controls that show text', async () => {
    const { container } = await render(
      <TreeGrid.Root items={items} selectionMode="multiple" defaultExpandedItems={['documents']}>
        <TreeGrid.Table aria-label="Files">
          {(item) => (
            <TreeGrid.Row itemId={item.id}>
              <TreeGrid.Cell>
                <TreeGrid.RowCheckbox>
                  <TreeGrid.RowCheckboxIndicator />
                </TreeGrid.RowCheckbox>
                <TreeGrid.RowExpansionTrigger />
                {item.label}
                <TreeGrid.CellInput aria-label={`Rename ${item.label}`} defaultValue={item.label} />
                <TreeGrid.CellButton aria-label={`Delete ${item.label}`}>
                  Delete
                </TreeGrid.CellButton>
              </TreeGrid.Cell>
            </TreeGrid.Row>
          )}
        </TreeGrid.Table>
      </TreeGrid.Root>,
    );
    expect(screen.getByRole('treegrid', { name: 'Files' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Delete Resume.pdf' })).toHaveTextContent('Delete');

    await expectNoAxeViolations(container);
  });

  it('columns with a header row', async () => {
    const { container } = await render(
      <TreeGrid.Root items={items} defaultExpandedItems={['documents']}>
        <TreeGrid.Table aria-label="Files">
          <TreeGrid.HeaderRow>
            <TreeGrid.HeaderCell>Name</TreeGrid.HeaderCell>
            <TreeGrid.HeaderCell>Kind</TreeGrid.HeaderCell>
            <TreeGrid.HeaderCell>
              <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
                Actions
              </span>
            </TreeGrid.HeaderCell>
          </TreeGrid.HeaderRow>
          <TreeGrid.Collection>
            {(item: TreeGrid.DefaultItem) => (
              <TreeGrid.Row itemId={item.id}>
                <TreeGrid.Cell>
                  <TreeGrid.RowExpansionTrigger />
                  {item.label}
                </TreeGrid.Cell>
                <TreeGrid.Cell>{item.children ? 'Folder' : 'File'}</TreeGrid.Cell>
                <TreeGrid.Cell>
                  <TreeGrid.CellButton aria-label={`Delete ${item.label}`}>×</TreeGrid.CellButton>
                </TreeGrid.Cell>
              </TreeGrid.Row>
            )}
          </TreeGrid.Collection>
        </TreeGrid.Table>
      </TreeGrid.Root>,
    );
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    expect(screen.getByRole('row', { name: 'Resume.pdf' })).toBeVisible();

    await expectNoAxeViolations(container);
  });
});
