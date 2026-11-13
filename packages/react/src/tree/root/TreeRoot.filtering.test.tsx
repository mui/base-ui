import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { describeTree } from '../../../test/describeTree';
import { Tree } from '..';

const items = [
  {
    id: 'projects',
    label: 'Projects',
    children: [
      { id: 'alpha', label: 'Alpha' },
      {
        id: 'archive',
        label: 'Archive',
        children: [{ id: 'old', label: 'Old release' }],
      },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    children: [{ id: 'notes', label: 'Meeting notes' }],
  },
  { id: 'readme', label: 'README' },
];

describeTree('TreeRoot - Filtering', ({ render }) => {
  it('uses locale-aware contains matching, trims the query, and restores expansion when cleared', async () => {
    const view = await render({
      items,
      filterValue: '  NOTES  ',
      defaultExpandedItems: ['documents'],
    });

    expect(view.getAllTreeItemIds()).toEqual(['documents', 'notes']);
    expect(view.getItemRoot('notes')).toHaveAttribute('data-filter-match');
    expect(view.getItemRoot('documents')).not.toHaveAttribute('data-filter-match');

    await view.setProps({ filterValue: '' });
    expect(view.getAllTreeItemIds()).toEqual(['projects', 'documents', 'notes', 'readme']);

    // The filter's forced expansion is not written to the uncontrolled model.
    await view.setProps({ filterValue: ' OLD ' });
    expect(view.getAllTreeItemIds()).toEqual(['projects', 'archive', 'old']);
    await view.setProps({ filterValue: '' });
    expect(view.getAllTreeItemIds()).toEqual(['projects', 'documents', 'notes', 'readme']);
  });

  it('calls a custom filter with the label, the query, and the item, and supports filter={null}', async () => {
    const startsWith = vi.fn((text: string, query: string) =>
      text.toLocaleLowerCase().startsWith(query.toLocaleLowerCase()),
    );
    const view = await render({ items, filterValue: 'me', filter: startsWith });
    // The default contains matching would also retain README.
    expect(view.getAllTreeItemIds()).toEqual(['documents', 'notes']);
    expect(startsWith).toHaveBeenCalledWith(
      'Meeting notes',
      'me',
      expect.objectContaining({ id: 'notes' }),
    );

    await view.setProps({ filter: null });
    expect(view.getAllTreeItemIds()).toEqual(['projects', 'documents', 'readme']);
  });

  it('projects each filter mode without changing the canonical hierarchy', async () => {
    const view = await render({
      items,
      filterValue: 'notes',
      filterMode: 'hide-non-matches',
      defaultExpandedItems: ['projects', 'archive'],
    });

    expect(view.getAllTreeItemIds()).toEqual(['documents', 'notes']);
    expect(view.actionsRef.current!.getChildIds(null)).toEqual(['projects', 'documents', 'readme']);

    await view.setProps({ filterMode: 'collapse-non-matches' });
    expect(view.getAllTreeItemIds()).toEqual(['projects', 'documents', 'notes', 'readme']);

    await view.setProps({ filterMode: 'expand-matches' });
    expect(view.getAllTreeItemIds()).toEqual([
      'projects',
      'alpha',
      'archive',
      'old',
      'documents',
      'notes',
      'readme',
    ]);
  });

  it('implements the no-match behavior of every mode', async () => {
    const view = await render({
      items,
      filterValue: 'missing',
      filterMode: 'hide-non-matches',
      defaultExpandedItems: ['projects'],
    });
    expect(view.getAllTreeItemIds()).toEqual([]);

    await view.setProps({ filterMode: 'collapse-non-matches' });
    expect(view.getAllTreeItemIds()).toEqual(['projects', 'documents', 'readme']);

    await view.setProps({ filterMode: 'expand-matches' });
    expect(view.getAllTreeItemIds()).toEqual([
      'projects',
      'alpha',
      'archive',
      'documents',
      'readme',
    ]);
  });

  it('retains the subtree of an exact matching parent', async () => {
    const view = await render({ items, filterValue: 'projects' });
    expect(view.getAllTreeItemIds()).toEqual(['projects', 'alpha', 'archive']);
  });

  it('lets filteredItems override internal filtering, deduplicates it, and supports numeric IDs', async () => {
    const numericItems = [
      { id: 1, label: 'One' },
      { id: 2, label: 'Two' },
      { id: 3, label: 'Three' },
    ];
    const view = await render({
      items: numericItems,
      filterValue: 'one',
      filteredItems: [numericItems[2], numericItems[2]],
    });

    expect(view.getAllTreeItemIds()).toEqual(['3']);
    expect(view.getItemRoot('3')).toHaveAttribute('data-filter-match');

    await view.setProps({ filteredItems: [] });
    expect(view.getAllTreeItemIds()).toEqual([]);

    await view.setProps({ filteredItems: undefined });
    expect(view.getAllTreeItemIds()).toEqual(['1']);
  });

  it('ignores and warns about external matches missing from the canonical items', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const view = await render({
        items,
        filteredItems: [{ id: 'unknown', label: 'Unknown' }],
      });

      expect(view.getAllTreeItemIds()).toEqual([]);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('must first exist in `items` or `defaultItems`'),
      );
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });

  it('reports projected ARIA sibling positions in hide mode', async () => {
    const view = await render({
      items: [
        { id: 'one', label: 'Match one' },
        { id: 'two', label: 'Other' },
        { id: 'three', label: 'Match three' },
      ],
      filterValue: 'match',
    });

    expect(view.getItemRoot('one')).toHaveAttribute('aria-setsize', '2');
    expect(view.getItemRoot('one')).toHaveAttribute('aria-posinset', '1');
    expect(view.getItemRoot('three')).toHaveAttribute('aria-setsize', '2');
    expect(view.getItemRoot('three')).toHaveAttribute('aria-posinset', '2');
  });

  it('uses the projected rows for keyboard navigation and range selection', async () => {
    const onSelectedItemsChange = vi.fn();
    const view = await render({
      items: [
        { id: 'one', label: 'Match one' },
        { id: 'two', label: 'Other' },
        { id: 'three', label: 'Match three' },
      ],
      filterValue: 'match',
      selectionMode: 'multiple',
      onSelectedItemsChange,
    });

    act(() => view.getItemRoot('one').focus());
    fireEvent.keyDown(view.getItemRoot('one'), { key: 'ArrowDown' });
    expect(view.getFocusedItemId()).toBe('three');

    fireEvent.click(view.getItemRoot('one'));
    fireEvent.click(view.getItemRoot('three'), { shiftKey: true });
    expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['one', 'three']);
  });

  it('keeps checkbox propagation on the canonical descendants while filtered', async () => {
    const onSelectedItemsChange = vi.fn();
    const view = await render({
      items: [
        {
          id: 'parent',
          label: 'Parent',
          children: [
            { id: 'match', label: 'Needle' },
            { id: 'hidden', label: 'Other' },
          ],
        },
      ],
      filterValue: 'needle',
      selectionMode: 'multiple',
      checkboxSelection: true,
      onSelectedItemsChange,
    });

    fireEvent.click(view.getItemRoot('parent').querySelector('[role=checkbox]')!);
    expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['parent', 'match', 'hidden']);
  });

  it('toggles only the enabled items the filter shows with Ctrl+A', async () => {
    const onSelectedItemsChange = vi.fn();
    const view = await render({
      items: [
        { id: 'apple', label: 'Apple' },
        { id: 'apex', label: 'Apex', disabled: true },
        { id: 'banana', label: 'Banana' },
        { id: 'apricot', label: 'Apricot' },
      ],
      filterValue: 'ap',
      selectionMode: 'multiple',
      defaultSelectedItems: ['banana'],
      onSelectedItemsChange,
    });

    act(() => view.getItemRoot('apple').focus());
    fireEvent.keyDown(view.getItemRoot('apple'), { key: 'a', ctrlKey: true });
    expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['banana', 'apple', 'apricot']);

    fireEvent.keyDown(view.getItemRoot('apple'), { key: 'a', ctrlKey: true });
    expect(onSelectedItemsChange.mock.calls.at(-1)![0]).toEqual(['banana']);
  });

  it('recomputes matches when loaded items enter the canonical model', async () => {
    const view = await render({ items: [{ id: 'one', label: 'One' }], filterValue: 'needle' });
    expect(view.getAllTreeItemIds()).toEqual([]);

    await view.setItems([
      { id: 'one', label: 'One' },
      { id: 'loaded', label: 'Loaded needle' },
    ]);
    expect(view.getAllTreeItemIds()).toEqual(['loaded']);
  });

  it('does not mutate controlled expansion or fire expansion callbacks for filtering', async () => {
    const onExpandedItemsChange = vi.fn();
    const view = await render({
      items,
      expandedItems: [],
      onExpandedItemsChange,
      filterValue: 'notes',
    });

    expect(view.actionsRef.current!.isItemExpanded('documents')).toBe(true);
    expect(onExpandedItemsChange).not.toHaveBeenCalled();
    await view.setProps({ filterValue: '' });
    expect(view.actionsRef.current!.isItemExpanded('documents')).toBe(false);
    expect(onExpandedItemsChange).not.toHaveBeenCalled();
  });

  it('does not rerun matching when expansion changes', async () => {
    const filter = vi.fn((text: string, query: string) => text.toLocaleLowerCase().includes(query));
    const view = await render({
      items,
      filterValue: 'alpha',
      filter,
      filterMode: 'expand-matches',
    });
    expect(filter).toHaveBeenCalled();
    filter.mockClear();

    // Archive holds no match, so the filter leaves it closed and this is a real
    // change to the expansion model.
    act(() => view.actionsRef.current!.setItemExpansion('archive', true));

    expect(view.actionsRef.current!.isItemExpanded('archive')).toBe(true);
    expect(filter).not.toHaveBeenCalled();
  });

  it('recovers DOM focus to the first exact match when filtering removes the focused row', async () => {
    const view = await render({ items, filterValue: '', defaultExpandedItems: ['projects'] });
    act(() => view.getItemRoot('alpha').focus());

    await view.setProps({ filterValue: 'notes' });
    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    });

    expect(view.getFocusedItemId()).toBe('notes');
  });

  it('moves DOM focus to the tree when filtering removes every row', async () => {
    const view = await render({ items, filterValue: '', defaultExpandedItems: ['projects'] });
    act(() => view.getItemRoot('alpha').focus());

    await view.setProps({ filterValue: 'no match' });
    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    });

    expect(screen.getByRole('treegrid')).toHaveFocus();
  });

  describe('expanding and collapsing while filtering', () => {
    it.each(['hide-non-matches', 'expand-matches'] as const)(
      'collapses and re-expands a row the filter expands (%s)',
      async (filterMode) => {
        const onExpandedItemsChange = vi.fn();
        const view = await render({
          items,
          filterValue: 'old',
          filterMode,
          onExpandedItemsChange,
        });
        expect(view.isItemExpanded('archive')).toBe(true);

        act(() => view.getItemRoot('archive').focus());
        fireEvent.keyDown(view.getItemRoot('archive'), { key: 'ArrowLeft' });
        expect(view.isItemExpanded('archive')).toBe(false);
        expect(view.getAllTreeItemIds()).not.toContain('old');

        fireEvent.keyDown(view.getItemRoot('archive'), { key: 'ArrowRight' });
        expect(view.isItemExpanded('archive')).toBe(true);
        expect(view.getAllTreeItemIds()).toContain('old');

        fireEvent.keyDown(view.getItemRoot('archive'), { key: 'Enter' });
        expect(view.isItemExpanded('archive')).toBe(false);

        // Filter-only expansion is view state: the model never changed.
        expect(onExpandedItemsChange).not.toHaveBeenCalled();
      },
    );

    it('also collapses a filter-expanded row in the model when the model expands it', async () => {
      const onExpandedItemsChange = vi.fn();
      const view = await render({
        items,
        filterValue: 'old',
        defaultExpandedItems: ['projects', 'archive'],
        onExpandedItemsChange,
      });

      fireEvent.click(view.getItemExpansionTrigger('archive')!);

      expect(view.isItemExpanded('archive')).toBe(false);
      expect(onExpandedItemsChange.mock.calls.at(-1)![0]).toEqual(['projects']);
    });

    it('keeps a filter-expanded row expanded when a controlled parent rejects its collapse', async () => {
      const onExpandedItemsChange = vi.fn();
      const view = await render({
        items,
        filterValue: 'old',
        expandedItems: ['projects', 'archive'],
        onExpandedItemsChange,
      });

      fireEvent.click(view.getItemExpansionTrigger('archive')!);

      expect(onExpandedItemsChange).toHaveBeenCalledTimes(1);
      expect(view.isItemExpanded('archive')).toBe(true);
    });

    it('leaves no trace of a canceled collapse in the filtered view', async () => {
      const view = await render({
        items,
        filterValue: 'old',
        expandedItems: ['projects', 'archive'],
        onExpandedItemsChange: (_: unknown, eventDetails: Tree.Root.ExpansionChangeEventDetails) =>
          eventDetails.cancel(),
      });

      fireEvent.click(view.getItemExpansionTrigger('archive')!);
      expect(view.isItemExpanded('archive')).toBe(true);

      // The filter still expands the path to its matches once the model collapses it.
      await view.setProps({ expandedItems: [] });
      expect(view.isItemExpanded('archive')).toBe(true);
    });

    it('keeps the filter-expanded rows expanded when collapsing all is canceled', async () => {
      const view = await render({
        items,
        filterValue: 'old',
        defaultExpandedItems: ['documents'],
        onExpandedItemsChange: (_: unknown, eventDetails: Tree.Root.ExpansionChangeEventDetails) =>
          eventDetails.cancel(),
      });
      expect(view.getAllTreeItemIds()).toEqual(['projects', 'archive', 'old']);

      act(() => view.actionsRef.current!.collapseAll());

      expect(view.getAllTreeItemIds()).toEqual(['projects', 'archive', 'old']);
    });

    it('toggles rows in collapse-non-matches mode without changing the model', async () => {
      const onExpandedItemsChange = vi.fn();
      const view = await render({
        items,
        filterValue: 'notes',
        filterMode: 'collapse-non-matches',
        onExpandedItemsChange,
      });
      expect(view.getAllTreeItemIds()).toEqual(['projects', 'documents', 'notes', 'readme']);

      act(() => view.getItemRoot('projects').focus());
      fireEvent.keyDown(view.getItemRoot('projects'), { key: 'ArrowRight' });
      expect(view.getAllTreeItemIds()).toEqual([
        'projects',
        'alpha',
        'archive',
        'documents',
        'notes',
        'readme',
      ]);

      fireEvent.click(view.getItemExpansionTrigger('documents')!);
      expect(view.isItemExpanded('documents')).toBe(false);
      expect(view.getAllTreeItemIds()).not.toContain('notes');

      fireEvent.keyDown(view.getItemRoot('projects'), { key: 'ArrowLeft' });
      expect(view.isItemExpanded('projects')).toBe(false);
      expect(onExpandedItemsChange).not.toHaveBeenCalled();
    });

    it('toggles a subtree in collapse-non-matches mode without changing the model', async () => {
      const onExpandedItemsChange = vi.fn();
      const view = await render({
        items,
        filterValue: 'notes',
        filterMode: 'collapse-non-matches',
        defaultExpandedItems: ['projects'],
        onExpandedItemsChange,
      });

      fireEvent.click(view.getItemExpansionTrigger('projects')!, { altKey: true });
      expect(view.getAllTreeItemIds()).toEqual([
        'projects',
        'alpha',
        'archive',
        'old',
        'documents',
        'notes',
        'readme',
      ]);

      fireEvent.click(view.getItemExpansionTrigger('projects')!, { altKey: true });
      expect(view.getAllTreeItemIds()).toEqual(['projects', 'documents', 'notes', 'readme']);
      expect(onExpandedItemsChange).not.toHaveBeenCalled();

      await view.setProps({ filterValue: '' });
      expect(view.getAllTreeItemIds()).toEqual([
        'projects',
        'alpha',
        'archive',
        'documents',
        'readme',
      ]);
    });

    it('collapses and expands the rows the filter expands with the bulk actions', async () => {
      const onExpandedItemsChange = vi.fn();
      const view = await render({ items, filterValue: 'old', onExpandedItemsChange });
      expect(view.getAllTreeItemIds()).toEqual(['projects', 'archive', 'old']);

      act(() => view.actionsRef.current!.collapseAll());
      expect(view.getAllTreeItemIds()).toEqual(['projects']);
      expect(onExpandedItemsChange).not.toHaveBeenCalled();

      act(() => {
        void view.actionsRef.current!.expandAll();
      });
      expect(view.getAllTreeItemIds()).toEqual(['projects', 'archive', 'old']);
    });

    it('discards the expansion changes when the filter changes', async () => {
      const view = await render({ items, filterValue: 'old' });

      fireEvent.click(view.getItemExpansionTrigger('archive')!);
      expect(view.isItemExpanded('archive')).toBe(false);

      await view.setProps({ filterValue: 'ol' });
      expect(view.isItemExpanded('archive')).toBe(true);

      await view.setProps({ filterValue: 'old' });
      expect(view.isItemExpanded('archive')).toBe(true);

      fireEvent.click(view.getItemExpansionTrigger('archive')!);
      await view.setProps({ filterValue: '' });
      await view.setProps({ filterValue: 'old' });
      expect(view.isItemExpanded('archive')).toBe(true);
    });
  });
});

const { render: renderElement } = createRenderer();

it('re-renders only the new rows when a row of a filtered tree expands', async () => {
  const actionsRef = React.createRef<Tree.Root.Actions | null>();
  const renderedGuides = new Set<Tree.ItemId>();
  await renderElement(
    <Tree.FilterProvider value="projects">
      <Tree.Root items={items} actionsRef={actionsRef}>
        <Tree.List>
          {(item) => (
            <Tree.Item itemId={item.id}>
              <Tree.ItemContent>
                <Tree.ItemIndentGuide
                  render={(props) => {
                    renderedGuides.add(item.id);
                    return <span {...props} />;
                  }}
                />
                {item.label}
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>
    </Tree.FilterProvider>,
  );
  renderedGuides.clear();

  act(() => actionsRef.current!.setItemExpansion('archive', true));

  expect(renderedGuides).toEqual(new Set(['old']));
});
