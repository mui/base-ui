import * as React from 'react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';
import { ActionTree } from '.';

const items: ActionTree.DefaultItem[] = [
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
describe.skipIf(isJSDOM)('ActionTree axe checks', () => {
  const { render } = createRenderer();

  it('item controls', async () => {
    const { container } = await render(
      <ActionTree.Root items={items} selectionMode="multiple" defaultExpandedItems={['documents']}>
        <ActionTree.List aria-label="Files">
          {(item) => (
            <ActionTree.Item itemId={item.id}>
              <ActionTree.ItemContent>
                <ActionTree.ItemCheckbox>
                  <ActionTree.ItemCheckboxIndicator />
                </ActionTree.ItemCheckbox>
                <ActionTree.ItemExpansionTrigger />
                {item.label}
                <ActionTree.ItemInput
                  aria-label={`Rename ${item.label}`}
                  defaultValue={item.label}
                />
                <ActionTree.ItemButton aria-label={`Delete ${item.label}`}>×</ActionTree.ItemButton>
              </ActionTree.ItemContent>
            </ActionTree.Item>
          )}
        </ActionTree.List>
      </ActionTree.Root>,
    );
    expect(screen.getByRole('treegrid', { name: 'Files' })).toBeVisible();
    expect(screen.getByRole('gridcell', { name: 'Resume.pdf' })).toBeVisible();

    await expectNoAxeViolations(container);
  });
});
