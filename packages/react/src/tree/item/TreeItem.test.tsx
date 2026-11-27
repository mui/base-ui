import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Tree } from '..';

const items: Tree.DefaultItem[] = [
  { id: 'documents', label: 'Documents', children: [{ id: 'resume', label: 'Resume' }] },
  { id: 'music', label: 'Music' },
];

function Example(props: Pick<Tree.Item.Props, 'onClick' | 'onKeyDown'>) {
  return (
    <Tree.Root items={items}>
      <Tree.List>
        {(item) => (
          <Tree.Item itemId={item.id} data-testid={item.id} {...props}>
            {item.label}
          </Tree.Item>
        )}
      </Tree.List>
    </Tree.Root>
  );
}

const ACTIVATION_KEYS = [
  { name: 'Space', key: ' ' },
  { name: 'Enter', key: 'Enter' },
];

describe('<Tree.Item />', () => {
  const { render } = createRenderer();

  describe('prop: itemId', () => {
    it('reports an id that is not in the items of the root', async () => {
      await expect(() =>
        render(
          <Tree.Root items={[{ id: 'a', label: 'A' }]}>
            <Tree.List>
              <Tree.Item itemId="a" />
              <Tree.Item itemId="b" />
            </Tree.List>
          </Tree.Root>,
        ),
      ).toErrorDev('A <Tree.Item> has the itemId "b", which is not in the `items` of <Tree.Root>');
    });
  });

  describe('prop: onClick', () => {
    it.each(ACTIVATION_KEYS)('runs when $name selects the item', async ({ key }) => {
      const handleClick = vi.fn();
      await render(<Example onClick={handleClick} />);
      const item = screen.getByTestId('music');
      act(() => item.focus());

      fireEvent.keyDown(item, { key });

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(item).toHaveAttribute('aria-selected', 'true');
    });

    it.each(ACTIVATION_KEYS)(
      'keeps $name from selecting the item when it calls preventBaseUIHandler()',
      async ({ key }) => {
        await render(<Example onClick={(event) => event.preventBaseUIHandler()} />);
        const item = screen.getByTestId('music');
        act(() => item.focus());

        fireEvent.keyDown(item, { key });

        expect(item).toHaveAttribute('aria-selected', 'false');
      },
    );

    it('does not run when Enter expands the item', async () => {
      const handleClick = vi.fn();
      await render(<Example onClick={handleClick} />);
      const item = screen.getByTestId('documents');
      act(() => item.focus());

      fireEvent.keyDown(item, { key: 'Enter' });

      expect(item).toHaveAttribute('aria-expanded', 'true');
      expect(item).toHaveAttribute('aria-selected', 'false');
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('prop: onKeyDown', () => {
    it.each(ACTIVATION_KEYS)(
      "keeps $name from selecting the item when it prevents the key's default",
      async ({ key }) => {
        const handleClick = vi.fn();
        await render(
          <Example onClick={handleClick} onKeyDown={(event) => event.preventDefault()} />,
        );
        const item = screen.getByTestId('music');
        act(() => item.focus());

        fireEvent.keyDown(item, { key });

        expect(item).toHaveAttribute('aria-selected', 'false');
        expect(handleClick).not.toHaveBeenCalled();
      },
    );
  });
});
