import * as React from 'react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';
import { Tree } from '.';

interface Item extends Tree.DefaultItem {
  childrenCount?: number | undefined;
  children?: Item[] | undefined;
}

const items: Item[] = [
  {
    id: 'documents',
    label: 'Documents',
    children: [
      { id: 'resume', label: 'Resume.pdf' },
      { id: 'invoices', label: 'Invoices', children: [{ id: 'q1', label: 'Invoice Q1.pdf' }] },
    ],
  },
  { id: 'photos', label: 'Photos', children: [{ id: 'sunset', label: 'Sunset.jpg' }] },
  { id: 'notes', label: 'Notes.txt' },
];

const ROW_STYLE: React.CSSProperties = {
  height: 28,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
};

function renderItem(item: Item) {
  return (
    <Tree.Item itemId={item.id} style={ROW_STYLE}>
      <Tree.ItemContent>
        <Tree.ItemExpansionTrigger />
        {item.label}
      </Tree.ItemContent>
    </Tree.Item>
  );
}

function renderCheckboxItem(item: Item) {
  return (
    <Tree.Item itemId={item.id}>
      <Tree.ItemContent>
        <Tree.ItemCheckbox>
          <Tree.ItemCheckboxIndicator />
        </Tree.ItemCheckbox>
        <Tree.ItemExpansionTrigger />
        {item.label}
      </Tree.ItemContent>
    </Tree.Item>
  );
}

function FilterableTree(props: { query: string }) {
  return (
    <Tree.FilterProvider defaultValue={props.query}>
      <Tree.Root items={items}>
        <Tree.Input aria-label="Filter files" />
        <Tree.Clear>Clear</Tree.Clear>
        <Tree.List aria-label="Files">{renderItem}</Tree.List>
        <Tree.Empty>No results</Tree.Empty>
      </Tree.Root>
    </Tree.FilterProvider>
  );
}

function formatViolation(violation: axe.Result) {
  const targets = violation.nodes.map((node) => node.target.join(' ')).join(', ');
  return `${violation.id}: ${violation.help} (${targets})`;
}

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, { resultTypes: ['violations'] });
  expect(results.violations.map(formatViolation)).toEqual([]);
}

// Each test checks that the tree reached the state under test before running axe on it.
describe.skipIf(isJSDOM)('Tree axe checks', () => {
  const { render } = createRenderer();

  it('default', async () => {
    const { container } = await render(
      <Tree.Root items={items} defaultExpandedItems={['documents']} defaultSelectedItems="resume">
        <Tree.List aria-label="Files">{renderItem}</Tree.List>
      </Tree.Root>,
    );
    expect(screen.getByRole('row', { name: 'Resume.pdf' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await expectNoAxeViolations(container);
  });

  it('checkbox selection', async () => {
    const { container } = await render(
      <Tree.Root
        items={items}
        selectionMode="multiple"
        defaultExpandedItems={['documents']}
        defaultSelectedItems={['resume']}
      >
        <Tree.List aria-label="Files">{renderCheckboxItem}</Tree.List>
      </Tree.Root>,
    );
    expect(screen.getByRole('checkbox', { name: 'Select Documents' })).toHaveAttribute(
      'aria-checked',
      'mixed',
    );

    await expectNoAxeViolations(container);
  });

  it('filtering with matches', async () => {
    const { container } = await render(<FilterableTree query="resume" />);
    expect(screen.getByRole('row', { name: 'Resume.pdf' })).toBeVisible();
    expect(screen.queryByRole('row', { name: 'Notes.txt' })).toBeNull();

    await expectNoAxeViolations(container);
  });

  // axe reports the empty treegrid under "needs review" (aria-required-children), not as a
  // violation.
  it('filtering with no matches', async () => {
    const { container } = await render(<FilterableTree query="nothing matches this" />);
    expect(screen.queryAllByRole('row')).toHaveLength(0);
    expect(screen.getByRole('status')).toHaveTextContent('No results');

    await expectNoAxeViolations(container);
  });

  it('Tree.Label', async () => {
    const { container } = await render(
      <Tree.Root items={items}>
        <Tree.Label>Files</Tree.Label>
        <Tree.List>{renderItem}</Tree.List>
      </Tree.Root>,
    );
    expect(screen.getByRole('treegrid', { name: 'Files' })).toBeVisible();

    await expectNoAxeViolations(container);
  });
});
