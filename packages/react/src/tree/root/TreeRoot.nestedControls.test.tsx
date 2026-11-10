import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Tree } from '..';

const { render } = createRenderer();

interface Item {
  id: string;
  label: string;
  children?: Item[];
}

const ITEMS: Item[] = [
  { id: '1', label: 'One' },
  { id: '2', label: 'Two' },
];

function row(itemId: string): HTMLElement {
  return screen.getByTestId(`item-${itemId}`);
}

describe('Tree — controls nested in item content', () => {
  function TreeWithButtons(props: { onAction?: (() => void) | undefined }) {
    return (
      <Tree.Root items={ITEMS} selectionMode="multiple">
        <Tree.List>
          {(item: Item) => (
            <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
              <Tree.ItemContent>
                {item.label}
                <button type="button" data-testid={`action-${item.id}`} onClick={props.onAction}>
                  Actions
                </button>
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>
    );
  }

  it('leaves Space to a nested button instead of toggling the row', async () => {
    await render(<TreeWithButtons />);

    const button = screen.getByTestId('action-1');
    act(() => {
      row('1').focus();
      button.focus();
    });

    const event = fireEvent.keyDown(button, { key: ' ' });

    // Not `preventDefault`ed, so the browser still activates the button…
    expect(event).toBe(true);
    // …and the row's selection is untouched.
    expect(row('1')).toHaveAttribute('aria-selected', 'false');
  });

  it('leaves click activation to a nested button', async () => {
    const onAction = vi.fn();
    await render(<TreeWithButtons onAction={onAction} />);

    fireEvent.click(screen.getByTestId('action-1'));

    expect(onAction).toHaveBeenCalledOnce();
    expect(row('1')).toHaveAttribute('aria-selected', 'false');
  });

  it('does not expand a row when clicking a nested button', async () => {
    await render(
      <Tree.Root
        items={[{ id: 'parent', label: 'Parent', children: [{ id: 'child', label: 'Child' }] }]}
        expandOnClick
      >
        <Tree.List>
          {(item: Item) => (
            <Tree.Item itemId={item.id} data-testid={`item-${item.id}`}>
              <Tree.ItemContent>
                {item.label}
                <button type="button" data-testid={`action-${item.id}`}>
                  Actions
                </button>
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>,
    );

    fireEvent.click(screen.getByTestId('action-parent'));

    expect(row('parent')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('item-child')).toBeNull();
  });

  it('still handles keys pressed on the row itself', async () => {
    await render(<TreeWithButtons />);

    act(() => {
      row('1').focus();
    });
    fireEvent.keyDown(row('1'), { key: ' ' });

    expect(row('1')).toHaveAttribute('aria-selected', 'true');
  });
});
