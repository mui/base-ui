import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Tree } from '..';
import { ActionTree } from '../../action-tree';

const items: Tree.DefaultItem[] = [
  { id: 'docs', label: 'Docs', children: [{ id: 'intro', label: 'Intro' }] },
  { id: 'about', label: 'About' },
];

function Example(props: {
  items?: Tree.DefaultItem[] | undefined;
  current?: string | undefined;
  onNavigate?: ((itemId: Tree.ItemId) => void) | undefined;
  root?:
    { selectionMode?: 'none' | 'single'; disabled?: boolean; expandOnClick?: boolean } | undefined;
}) {
  const { items: treeItems = items, current, onNavigate, root } = props;
  return (
    <Tree.Root items={treeItems} defaultExpandedItems={['docs']} {...root}>
      <Tree.List aria-label="Pages">
        {(item) => (
          <Tree.LinkItem
            itemId={item.id}
            href={`#${item.id}`}
            active={item.id === current}
            data-testid={item.id}
            onClick={(event) => {
              event.preventDefault();
              onNavigate?.(item.id);
            }}
            onAuxClick={() => onNavigate?.(item.id)}
          >
            {item.label}
          </Tree.LinkItem>
        )}
      </Tree.List>
    </Tree.Root>
  );
}

describe('<Tree.LinkItem />', () => {
  const { render } = createRenderer();

  it('renders the item as a link', async () => {
    await render(<Example />);
    const item = screen.getByRole('treeitem', { name: 'About' });
    expect(item.tagName).toBe('A');
    expect(item).toHaveAttribute('href', '#about');
  });

  it('marks the active item as the current page', async () => {
    const { setProps } = await render(<Example current="about" />);
    expect(screen.getByTestId('about')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('about')).toHaveAttribute('data-active', '');
    expect(screen.getByTestId('intro')).not.toHaveAttribute('aria-current');

    await setProps({ current: 'intro' });
    expect(screen.getByTestId('about')).not.toHaveAttribute('aria-current');
    expect(screen.getByTestId('about')).not.toHaveAttribute('data-active');
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

  it('follows the link on Enter instead of expanding the item', async () => {
    const onNavigate = vi.fn();
    const { user } = await render(<Example onNavigate={onNavigate} />);
    const folder = screen.getByTestId('docs');
    act(() => folder.focus());
    expect(folder).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Enter}');

    expect(onNavigate).toHaveBeenCalledWith('docs');
    expect(folder).toHaveAttribute('aria-expanded', 'true');
  });

  it('selects the item it follows on click', async () => {
    const onNavigate = vi.fn();
    await render(<Example onNavigate={onNavigate} root={{ selectionMode: 'single' }} />);

    fireEvent.click(screen.getByTestId('about'));

    expect(onNavigate).toHaveBeenCalledWith('about');
    expect(screen.getByTestId('about')).toHaveAttribute('aria-selected', 'true');
  });

  it.each(['ctrlKey', 'metaKey', 'shiftKey'])(
    'leaves the selection alone on a click with %s, which opens the link elsewhere',
    async (modifier) => {
      await render(<Example root={{ selectionMode: 'single' }} />);

      fireEvent.click(screen.getByTestId('about'), { [modifier]: true });

      expect(screen.getByTestId('about')).toHaveAttribute('aria-selected', 'false');
    },
  );

  it('does not toggle expansion on click with expandOnClick', async () => {
    await render(<Example root={{ expandOnClick: true }} />);
    const folder = screen.getByTestId('docs');

    fireEvent.click(folder);

    expect(folder).toHaveAttribute('aria-expanded', 'true');
  });

  it.each([
    { name: 'tree', props: { root: { disabled: true } } },
    {
      name: 'ancestor',
      props: {
        items: [
          {
            id: 'docs',
            label: 'Docs',
            disabled: true,
            children: [{ id: 'intro', label: 'Intro' }],
          },
        ],
      },
    },
  ])('does not follow the link when its $name is disabled', async ({ props }) => {
    const onNavigate = vi.fn();
    await render(<Example onNavigate={onNavigate} {...props} />);
    const item = screen.getByTestId('intro');
    expect(item).toHaveAttribute('aria-disabled', 'true');

    expect(fireEvent.click(item)).toBe(false);
    const auxClick = fireEvent(
      item,
      new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }),
    );
    expect(auxClick).toBe(false);
    expect(onNavigate).not.toHaveBeenCalled();
  });
  it('throws in an ActionTree.Root', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      render(
        <ActionTree.Root items={[{ id: 'a', label: 'A' }]}>
          <ActionTree.List>
            {(item) => (
              <Tree.LinkItem itemId={item.id} href="#a">
                {item.label}
              </Tree.LinkItem>
            )}
          </ActionTree.List>
        </ActionTree.Root>,
      ),
    ).rejects.toThrow(
      /<Tree\.LinkItem> cannot be placed in <ActionTree\.Root>.*<ActionTree\.ItemLink>/,
    );
  });
});
