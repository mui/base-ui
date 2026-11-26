import * as React from 'react';
import { act, createRenderer, fireEvent, screen, waitFor, within } from '@mui/internal-test-utils';
import { describe, expect, it } from 'vitest';
import HeroCSS from './hero/css-modules';
import HeroTailwind from './hero/tailwind';
import FilteringCSS from './filtering/css-modules';
import FilteringTailwind from './filtering/tailwind';
import ColumnsCSS from './columns/css-modules';
import ColumnsTailwind from './columns/tailwind';

const isJSDOM = window.navigator.userAgent.includes('jsdom');

describe.skipIf(isJSDOM)('Tree grid demo interactions', () => {
  const { render } = createRenderer();

  it.each([
    ['css-modules', FilteringCSS],
    ['tailwind', FilteringTailwind],
  ])('describes the items matching the filter in the %s filtering demo', async (_, Demo) => {
    await render(<Demo />);

    expect(screen.getByRole('row', { name: 'Invoice_Q1.pdf' })).toHaveAttribute(
      'aria-description',
      'Match. Press Tab to reach the remove button',
    );
    expect(screen.getByRole('row', { name: 'Invoices' })).toHaveAttribute(
      'aria-description',
      'Match',
    );
    // An ancestor kept for context isn't a match.
    expect(screen.getByRole('row', { name: 'Documents' })).not.toHaveAttribute('aria-description');
  });

  it.each([
    ['css-modules', HeroCSS],
    ['tailwind', HeroTailwind],
  ])('reaches every control of a task in the %s hero demo', async (_, Demo) => {
    await render(<Demo />);
    const row = screen.getByRole('row', { name: 'Wireframes' });
    const link = screen.getByRole('link', { name: 'Wireframes' });
    const input = screen.getByRole('textbox', {
      name: 'Estimate for Wireframes, in hours',
    }) as HTMLInputElement;
    const done = screen.getByRole('switch', { name: 'Mark Wireframes as done' });
    const remove = screen.getByRole('button', { name: 'Remove Wireframes' });

    act(() => row.focus());
    fireEvent.keyDown(row, { key: 'ArrowRight' });
    expect(link).toHaveFocus();
    fireEvent.keyDown(link, { key: 'ArrowRight' });
    expect(input).toHaveFocus();
    input.setSelectionRange(input.value.length, input.value.length);
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect(done).toHaveFocus();
    fireEvent.keyDown(done, { key: 'ArrowRight' });
    expect(remove).toHaveFocus();

    // The arrows go back through every control.
    fireEvent.keyDown(remove, { key: 'ArrowLeft' });
    expect(done).toHaveFocus();
    fireEvent.keyDown(done, { key: 'ArrowLeft' });
    expect(input).toHaveFocus();

    act(() => done.focus());
    expect(done).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(done);
    expect(done).toHaveAttribute('aria-checked', 'false');
    fireEvent.keyDown(done, { key: 'ArrowDown' });
    expect(screen.getByRole('row', { name: 'Homepage copy' })).toHaveFocus();

    fireEvent.click(remove);
    await waitFor(() => expect(screen.queryByRole('row', { name: 'Wireframes' })).toBeNull());
  });

  it.each([
    ['css-modules', ColumnsCSS],
    ['tailwind', ColumnsTailwind],
  ])('names the columns and stays in a column in the %s columns demo', async (_, Demo) => {
    await render(<Demo />);
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Name',
      'Size',
      'Modified',
      'Actions',
    ]);

    const row = screen.getByRole('row', { name: 'Button.tsx' });
    act(() => row.focus());
    fireEvent.keyDown(row, { key: 'ArrowRight' });
    const name = screen.getByRole('gridcell', { name: 'Button.tsx' });
    expect(name).toHaveFocus();
    fireEvent.keyDown(name, { key: 'ArrowRight' });
    const size = screen.getByRole('gridcell', { name: '4 KB' });
    expect(size).toHaveFocus();

    fireEvent.keyDown(size, { key: 'ArrowDown' });
    const nextSize = screen.getByRole('gridcell', { name: '12 KB' });
    expect(nextSize).toHaveFocus();

    // The remove button is the stop of the last column.
    fireEvent.keyDown(nextSize, { key: 'ArrowRight' });
    const modified = within(screen.getByRole('row', { name: 'Dialog.tsx' })).getByRole('gridcell', {
      name: 'Mar 5',
    });
    expect(modified).toHaveFocus();
    fireEvent.keyDown(modified, { key: 'ArrowRight' });
    const remove = screen.getByRole('button', { name: 'Remove Dialog.tsx' });
    expect(remove).toHaveFocus();
    fireEvent.keyDown(remove, { key: 'ArrowUp' });
    expect(screen.getByRole('button', { name: 'Remove Button.tsx' })).toHaveFocus();
  });
});
