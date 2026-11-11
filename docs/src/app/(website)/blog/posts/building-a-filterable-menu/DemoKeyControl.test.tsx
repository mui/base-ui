// @vitest-environment jsdom
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import DemoKeyControl from './DemoKeyControl';

describe('DemoKeyControl', () => {
  const { render } = createRenderer();

  it.each([
    { name: 'Shift', shiftKey: true },
    { name: 'Control', ctrlKey: true },
    { name: 'Command', metaKey: true },
    { name: 'Alt', altKey: true },
  ])('runs the highlighted action with $name+Enter', async ({ name, ...modifiers }) => {
    await render(<DemoKeyControl />);
    const input = screen.getByRole('searchbox');
    input.focus();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByRole('menuitem', { name: 'Rename' }).hasAttribute('data-highlighted')).toBe(
      true,
    );
    expect(screen.getByRole('status').textContent).toBe('');

    fireEvent.keyDown(input, { key: 'Enter', ...modifiers });

    expect(screen.getByRole('status').textContent).toBe('Ran "Rename"');
  });

  it('navigates the menu when empty and moves the caret with a query', async () => {
    await render(<DemoKeyControl />);
    const input = screen.getByRole<HTMLInputElement>('searchbox');
    input.focus();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'End' });
    expect(screen.getByRole('menuitem', { name: 'Delete' }).hasAttribute('data-highlighted')).toBe(
      true,
    );
    fireEvent.keyDown(input, { key: 'Home' });
    expect(screen.getByRole('menuitem', { name: 'Rename' }).hasAttribute('data-highlighted')).toBe(
      true,
    );

    fireEvent.change(input, { target: { value: 'de' } });
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    input.focus();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const item = screen.getByRole('menuitem', { name: 'Move to folder' });
    expect(item.hasAttribute('data-highlighted')).toBe(true);
    input.setSelectionRange(2, 2);
    fireEvent.keyDown(input, { key: 'Home' });
    expect(input.selectionStart).toBe(0);
    fireEvent.keyDown(input, { key: 'End' });
    expect(input.selectionStart).toBe(2);
    expect(item.hasAttribute('data-highlighted')).toBe(true);
  });
});
