import * as React from 'react';
import { act, createRenderer, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import '../../../../../../css/index.css';
import FileExplorer from '../../../../../(private)/experiments/tree/tree-file-explorer';
import UpdatingItemsCSS from './updating-items/css-modules';
import UpdatingItemsTailwind from './updating-items/tailwind';
import HighFrequencyCSS from './high-frequency-updates/css-modules';
import HighFrequencyTailwind from './high-frequency-updates/tailwind';
import StickyCSS from './sticky-ancestors/css-modules';
import StickyTailwind from './sticky-ancestors/tailwind';
import FilteringCSS from './filtering/css-modules';
import FilteringTailwind from './filtering/tailwind';

const isJSDOM = window.navigator.userAgent.includes('jsdom');

describe.skipIf(isJSDOM)('Tree demo interactions', () => {
  const { render } = createRenderer();

  it.each([
    ['css-modules', FilteringCSS],
    ['tailwind', FilteringTailwind],
  ])('describes the items matching the filter in the %s filtering demo', async (_, Demo) => {
    await render(<Demo />);

    expect(screen.getByRole('treeitem', { name: 'Invoice_Q1.pdf' })).toHaveAttribute(
      'aria-description',
      'Match',
    );
    // An ancestor kept for context isn't a match.
    expect(screen.getByRole('treeitem', { name: 'Documents' })).not.toHaveAttribute(
      'aria-description',
    );
  });

  it.each([
    ['css-modules', UpdatingItemsCSS],
    ['tailwind', UpdatingItemsTailwind],
  ])('applies each toolbar action as a transaction in the %s updating demo', async (_, Demo) => {
    await render(<Demo />);
    const rowNames = () => screen.getAllByRole('treeitem').map((row) => row.textContent);

    fireEvent.click(screen.getByRole('treeitem', { name: 'Notes.txt' }));
    fireEvent.click(screen.getByRole('button', { name: 'New file' }));
    const names = rowNames();
    expect(names[names.indexOf('Notes.txt') + 1]).toMatch(/^Untitled \d+\.txt$/);

    fireEvent.click(screen.getByRole('treeitem', { name: 'Documents' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sort' }));
    expect(rowNames().slice(1, 4)).toEqual(['Budget.xlsx', 'Notes.txt', 'Resume.pdf']);

    fireEvent.click(screen.getByRole('treeitem', { name: 'Photos' }));
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    await waitFor(() =>
      expect(screen.getByRole('treeitem', { name: 'Photos' })).toHaveAttribute('aria-level', '2'),
    );
    expect(screen.getByRole('treeitem', { name: 'Archive' })).toHaveAttribute('aria-level', '1');

    fireEvent.click(screen.getByRole('button', { name: 'Unarchive' }));
    await waitFor(() => expect(screen.queryByRole('treeitem', { name: 'Archive' })).toBe(null));
    const rootNames = screen
      .getAllByRole('treeitem')
      .filter((row) => row.getAttribute('aria-level') === '1')
      .map((row) => row.textContent);
    expect(rootNames).toEqual(['Documents', 'Photos', 'Todo.md']);
    expect(screen.getByRole('button', { name: 'Archive' })).toBeVisible();

    // An item whose folder was archived after it goes back to the root.
    fireEvent.click(screen.getByRole('treeitem', { name: 'Notes.txt' }));
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    fireEvent.click(screen.getByRole('treeitem', { name: 'Documents' }));
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    fireEvent.click(screen.getByRole('treeitem', { name: 'Notes.txt' }));
    fireEvent.click(screen.getByRole('button', { name: 'Unarchive' }));
    expect(screen.getByRole('treeitem', { name: 'Notes.txt' })).toHaveAttribute('aria-level', '1');
    expect(screen.getByRole('button', { name: 'Archive' })).toBeVisible();

    // A folder whose files were all deleted still takes new files.
    fireEvent.click(screen.getByRole('treeitem', { name: 'Photos' }).querySelector('button')!);
    for (const name of ['Sunset.jpg', 'Beach.png']) {
      fireEvent.click(screen.getByRole('treeitem', { name }));
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    }
    fireEvent.click(screen.getByRole('treeitem', { name: 'Photos' }));
    fireEvent.click(screen.getByRole('button', { name: 'New file' }));
    const photosNames = rowNames();
    const newFile = photosNames[photosNames.indexOf('Photos') + 1]!;
    expect(newFile).toMatch(/^Untitled \d+\.txt$/);
    expect(screen.getByRole('treeitem', { name: newFile })).toHaveAttribute('aria-level', '2');

    fireEvent.click(screen.getByRole('treeitem', { name: 'Todo.md' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.queryByRole('treeitem', { name: 'Todo.md' })).toBe(null);
  });

  it.each([
    ['css-modules', HighFrequencyCSS],
    ['tailwind', HighFrequencyTailwind],
  ])('streams updates until they stop in the %s high-frequency demo', async (_, Demo) => {
    await render(<Demo />);
    const traffic = () => screen.getAllByText(/req\/s$/).map((element) => element.textContent);
    const initial = traffic();

    fireEvent.click(screen.getByRole('button', { name: 'Start live updates' }));
    await waitFor(() => expect(traffic()).not.toEqual(initial), { timeout: 3000 });

    fireEvent.click(screen.getByRole('button', { name: 'Stop live updates' }));
    const stopped = traffic();
    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });
    expect(traffic()).toEqual(stopped);
  });

  it.each([
    ['css-modules', StickyCSS],
    ['tailwind', StickyTailwind],
  ])(
    'keeps the row of a pinned ancestor clear of the pinned rows in the %s sticky demo',
    async (_, Demo) => {
      await render(<Demo />);
      const list = screen.getByRole('tree');
      // The pinned copies are aria-hidden, so they have no role to query.
      const overlay = () => list.parentElement!.querySelector('[aria-hidden]');
      const pinnedLabels = () => Array.from(overlay()?.children ?? [], (row) => row.textContent);
      const expectClearOfPinnedRows = (row: HTMLElement) => {
        const overlayBottom =
          overlay()?.getBoundingClientRect().bottom ?? list.getBoundingClientRect().top;
        expect(row.getBoundingClientRect().top).toBeGreaterThanOrEqual(overlayBottom - 1);
      };

      // Scrolls past the first rows of Level 3, so Level 1 to Level 3 are pinned.
      await act(async () => {
        list.scrollTop = 15 * 28 + 10;
      });
      await waitFor(() => expect(pinnedLabels()).toEqual(['Level 1', 'Level 2', 'Level 3']));

      fireEvent.click(screen.getByText('Level 2', { selector: '[aria-hidden] span' }));
      const level2 = await screen.findByRole('treeitem', { name: 'Level 2' });
      await waitFor(() => expect(level2).toHaveFocus());
      await waitFor(() => expect(pinnedLabels()).toEqual(['Level 1']));
      expectClearOfPinnedRows(level2);

      // Focuses the fourth leaf of Level 3, then goes back up to Level 3 while it is pinned.
      await act(async () => {
        list.scrollTop = 15 * 28 + 10;
      });
      await waitFor(() => expect(pinnedLabels()).toEqual(['Level 1', 'Level 2', 'Level 3']));
      const rows = screen.getAllByRole('treeitem');
      const level3Index = rows.findIndex((row) => row.textContent === 'Level 3');
      fireEvent.click(rows[level3Index + 4]);
      await waitFor(() => expect(rows[level3Index + 4]).toHaveFocus());
      for (let i = 4; i > 0; i -= 1) {
        fireEvent.keyDown(rows[level3Index + i], { key: 'ArrowUp' });
      }
      const level3 = await screen.findByRole('treeitem', { name: 'Level 3' });
      await waitFor(() => expect(level3).toHaveFocus());
      await waitFor(() => expect(pinnedLabels()).toEqual(['Level 1', 'Level 2']));
      expectClearOfPinnedRows(level3);
    },
  );

  it('clears the previous context-menu target when opening on whitespace', async () => {
    const { user } = await render(<FileExplorer />);
    fireEvent.contextMenu(screen.getByRole('treeitem', { name: 'packages' }), {
      clientX: 100,
      clientY: 100,
      button: 2,
    });
    expect(await screen.findByRole('menuitem', { name: /^Delete/ })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).toBe(null));
    fireEvent.contextMenu(screen.getByRole('tree'), { clientX: 100, clientY: 400, button: 2 });
    expect(await screen.findByRole('menuitem', { name: /^Delete/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).toBe(null));
    expect(screen.getByRole('treeitem', { name: 'packages' })).toBeVisible();
  });
});
