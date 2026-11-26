import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Tree } from '..';
import { TreeGrid } from '../../tree-grid';

const items: Tree.DefaultItem[] = [
  { id: 'docs', label: 'Docs', children: [{ id: 'intro', label: 'Intro' }] },
  { id: 'about', label: 'About' },
];

function Example(props: {
  items?: Tree.DefaultItem[] | undefined;
  current?: string | undefined;
  onNavigate?: ((itemId: Tree.ItemId) => void) | undefined;
  root?: { disabled?: boolean; expandOnClick?: boolean } | undefined;
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
    await render(<Example onNavigate={onNavigate} />);

    fireEvent.click(screen.getByTestId('about'));

    expect(onNavigate).toHaveBeenCalledWith('about');
    expect(screen.getByTestId('about')).toHaveAttribute('aria-selected', 'true');
  });

  it.each(['ctrlKey', 'metaKey', 'shiftKey'])(
    'leaves the selection alone on a click with %s, which opens the link elsewhere',
    async (modifier) => {
      await render(<Example />);

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
  describe('with an expansion trigger', () => {
    function TriggerExample(props: {
      disabled?: boolean | undefined;
      allowPropagation?: boolean | undefined;
    }) {
      return (
        <Tree.Root
          items={items}
          defaultExpandedItems={['docs']}
          onExpandedItemsChange={(_expandedItems, eventDetails) => {
            if (props.allowPropagation) {
              eventDetails.allowPropagation();
            }
          }}
        >
          <Tree.List aria-label="Pages">
            {(item) => (
              <Tree.LinkItem itemId={item.id} href={`#${item.id}`} data-testid={item.id}>
                <Tree.ItemExpansionTrigger
                  disabled={props.disabled}
                  data-testid={`trigger-${item.id}`}
                />
                {item.label}
              </Tree.LinkItem>
            )}
          </Tree.List>
        </Tree.Root>
      );
    }

    it('renders a span, since a link cannot contain a button', async () => {
      await render(<TriggerExample />);

      const trigger = screen.getByTestId('trigger-docs');
      expect(trigger.localName).toBe('span');
      expect(trigger).not.toHaveAttribute('role');
      expect(trigger).not.toHaveAttribute('aria-label');
      expect(trigger).not.toHaveAttribute('tabindex');
      expect(screen.queryByRole('button')).toBe(null);
    });

    it('expands the item without following the link', async () => {
      await render(<TriggerExample />);

      expect(screen.getByTestId('docs')).toHaveAttribute('aria-expanded', 'true');
      expect(fireEvent.click(screen.getByTestId('trigger-docs'))).toBe(false);
      expect(screen.getByTestId('docs')).toHaveAttribute('aria-expanded', 'false');
    });

    it('does not select the item when the click propagates past the tree', async () => {
      const onOuterClick = vi.fn();
      const { user } = await render(
        <div onClick={onOuterClick}>
          <TriggerExample allowPropagation />
        </div>,
      );

      expect(screen.getByTestId('docs')).toHaveAttribute('aria-selected', 'false');
      await user.click(screen.getByTestId('trigger-docs'));

      expect(onOuterClick).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('docs')).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByTestId('docs')).toHaveAttribute('aria-selected', 'false');
    });

    it('ignores clicks while disabled, without following the link', async () => {
      await render(<TriggerExample disabled />);

      expect(fireEvent.click(screen.getByTestId('trigger-docs'))).toBe(false);
      expect(screen.getByTestId('docs')).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByTestId('docs')).toHaveAttribute('aria-selected', 'false');
    });
  });

  it('throws in a TreeGrid.Root', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      render(
        <TreeGrid.Root items={[{ id: 'a', label: 'A' }]}>
          <TreeGrid.Table>
            {(item) => (
              <Tree.LinkItem itemId={item.id} href="#a">
                {item.label}
              </Tree.LinkItem>
            )}
          </TreeGrid.Table>
        </TreeGrid.Root>,
      ),
    ).rejects.toThrow(
      /<Tree\.LinkItem> cannot be placed in <TreeGrid\.Root>.*<TreeGrid\.CellLink>/,
    );
  });
});
