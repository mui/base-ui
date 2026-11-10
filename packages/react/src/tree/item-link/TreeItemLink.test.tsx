import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Tree } from '..';

const items: Tree.DefaultItem[] = [
  { id: 'docs', label: 'Docs', children: [{ id: 'intro', label: 'Intro' }] },
  { id: 'about', label: 'About' },
];

function Example(props: {
  items?: Tree.DefaultItem[] | undefined;
  current?: string | undefined;
  onNavigate?: ((itemId: Tree.ItemId) => void) | undefined;
  root?: { selectionMode?: 'none' | 'single' | undefined; disabled?: boolean } | undefined;
}) {
  const { items: treeItems = items, current, onNavigate, root } = props;
  return (
    <Tree.Root items={treeItems} defaultExpandedItems={['docs']} {...root}>
      <Tree.List aria-label="Pages">
        {(item) => (
          <Tree.Item itemId={item.id} data-testid={item.id}>
            <Tree.ItemContent>
              <Tree.ItemLink
                href={`#${item.id}`}
                active={item.id === current}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate?.(item.id);
                }}
                onAuxClick={() => onNavigate?.(item.id)}
              >
                {item.label}
              </Tree.ItemLink>
            </Tree.ItemContent>
          </Tree.Item>
        )}
      </Tree.List>
    </Tree.Root>
  );
}

describe('<Tree.ItemLink />', () => {
  const { render } = createRenderer();

  it('marks the active link and its item as the current page', async () => {
    const { setProps } = await render(<Example current="about" />);
    const link = screen.getByRole('link', { name: 'About' });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveAttribute('data-active', '');
    expect(screen.getByTestId('about')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('intro')).not.toHaveAttribute('aria-current');

    await setProps({ current: 'intro' });
    expect(screen.getByTestId('about')).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'About' })).not.toHaveAttribute('data-active');
    expect(screen.getByTestId('intro')).toHaveAttribute('aria-current', 'page');
  });

  it('gives the tab stop to the current page when no item is selected', async () => {
    const { setProps } = await render(<Example current="intro" />);
    expect(screen.getByTestId('intro')).toHaveAttribute('tabindex', '0');
    expect(screen.getByTestId('docs')).toHaveAttribute('tabindex', '-1');

    await setProps({ current: 'about' });
    expect(screen.getByTestId('about')).toHaveAttribute('tabindex', '0');
    expect(screen.getByTestId('intro')).toHaveAttribute('tabindex', '-1');
  });

  it('follows the link when Enter has no other action on the item', async () => {
    const onNavigate = vi.fn();
    await render(<Example onNavigate={onNavigate} root={{ selectionMode: 'none' }} />);
    const row = screen.getByTestId('about');
    act(() => row.focus());
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onNavigate).toHaveBeenCalledWith('about');
  });

  it('does not follow the link of a disabled item on Enter', async () => {
    const onNavigate = vi.fn();
    await render(
      <Example onNavigate={onNavigate} root={{ selectionMode: 'none', disabled: true }} />,
    );
    const row = screen.getByTestId('about');
    act(() => row.focus());
    expect(row).toHaveFocus();
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it.each([
    ['tree', { root: { disabled: true } }],
    [
      'ancestor',
      {
        items: [
          {
            id: 'docs',
            label: 'Docs',
            disabled: true,
            children: [{ id: 'intro', label: 'Intro' }],
          },
        ],
      },
    ],
  ])('does not follow the link when its %s is disabled', async (_, props) => {
    const onNavigate = vi.fn();
    await render(<Example onNavigate={onNavigate} {...props} />);
    const link = screen.getByRole('link', { name: 'Intro' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('data-disabled', '');

    const click = fireEvent.click(link);
    expect(click).toBe(false);
    const auxClick = fireEvent(
      link,
      new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }),
    );
    expect(auxClick).toBe(false);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('keeps Enter for expansion and selection', async () => {
    const onNavigate = vi.fn();
    await render(<Example onNavigate={onNavigate} root={{ selectionMode: 'single' }} />);
    const folder = screen.getByTestId('docs');
    act(() => folder.focus());
    fireEvent.keyDown(folder, { key: 'Enter' });
    expect(folder).toHaveAttribute('aria-expanded', 'false');

    const leaf = screen.getByTestId('about');
    act(() => leaf.focus());
    fireEvent.keyDown(leaf, { key: 'Enter' });
    expect(leaf).toHaveAttribute('aria-selected', 'true');
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
