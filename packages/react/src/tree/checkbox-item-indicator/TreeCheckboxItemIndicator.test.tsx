import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Tree } from '..';

const items: Tree.DefaultItem[] = [
  {
    id: 'a',
    label: 'A',
    children: [
      { id: 'a1', label: 'A1' },
      { id: 'a2', label: 'A2' },
    ],
  },
  { id: 'b', label: 'B' },
];

function CheckboxTree(props: { keepMounted?: boolean | undefined; select?: string | undefined }) {
  const actionsRef = React.useRef<Tree.Root.Actions | null>(null);
  return (
    <React.Fragment>
      <button
        type="button"
        data-testid="select"
        onClick={() => actionsRef.current!.setItemSelection(props.select ?? 'a', true)}
      />
      <Tree.Root
        defaultItems={items}
        selectionMode="multiple"
        defaultExpandedItems={['a']}
        actionsRef={actionsRef}
      >
        <Tree.List>
          {(item) => (
            <Tree.CheckboxItem itemId={item.id}>
              <Tree.CheckboxItemIndicator
                keepMounted={props.keepMounted}
                data-testid={`indicator-${item.id}`}
              />
              {item.label}
            </Tree.CheckboxItem>
          )}
        </Tree.List>
      </Tree.Root>
    </React.Fragment>
  );
}

describe('<Tree.CheckboxItemIndicator />', () => {
  const { render } = createRenderer();

  it('mounts only while the item is checked', async () => {
    await render(<CheckboxTree />);
    expect(screen.queryByTestId('indicator-a')).toBe(null);

    act(() => screen.getByTestId('select').click());

    expect(screen.getByTestId('indicator-a')).toBeInTheDocument();
    expect(screen.getByTestId('indicator-a')).toHaveAttribute('aria-hidden', 'true');
  });

  it('stays mounted with keepMounted, carrying the checked state as an attribute', async () => {
    await render(<CheckboxTree keepMounted />);
    expect(screen.getByTestId('indicator-a')).toHaveAttribute('data-unchecked');

    act(() => screen.getByTestId('select').click());

    expect(screen.getByTestId('indicator-a')).toHaveAttribute('data-checked');
  });

  it('mounts as indeterminate while only some descendants are checked', async () => {
    await render(<CheckboxTree select="a1" />);
    expect(screen.queryByTestId('indicator-a')).toBe(null);

    act(() => screen.getByTestId('select').click());

    expect(screen.getByRole('treeitem', { name: 'A' })).toHaveAttribute('aria-checked', 'mixed');
    expect(screen.getByTestId('indicator-a')).toHaveAttribute('data-indeterminate');
    expect(screen.getByTestId('indicator-a')).not.toHaveAttribute('data-checked');
  });

  it('throws outside Tree.CheckboxItem', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      render(
        <Tree.Root items={items}>
          <Tree.List>
            {(item) => (
              <Tree.Item itemId={item.id}>
                <Tree.CheckboxItemIndicator />
              </Tree.Item>
            )}
          </Tree.List>
        </Tree.Root>,
      ),
    ).rejects.toThrow(
      /<Tree\.CheckboxItemIndicator> reads the checked state of <Tree\.CheckboxItem>/,
    );
  });
});
