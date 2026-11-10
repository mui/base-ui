import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { reset as resetLogOnce } from '@base-ui/utils/createLogOnce';
import { screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Tree } from '..';

const items: Tree.DefaultItem[] = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
];

function List() {
  return (
    <Tree.List>
      {(item) => (
        <Tree.Item itemId={item.id} data-testid={item.id}>
          <Tree.ItemContent>{item.label}</Tree.ItemContent>
        </Tree.Item>
      )}
    </Tree.List>
  );
}

const misplaced = (name: string) =>
  expect.stringContaining(`<Tree.${name}> has no effect inside <Tree.Root>`);

describe('Tree root features', () => {
  const { render } = createRenderer();

  afterEach(() => {
    resetLogOnce();
    vi.restoreAllMocks();
  });

  it('warns when a provider is rendered between the root and its list', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(
      <Tree.Root defaultItems={items}>
        <Tree.FilterProvider defaultValue="b">
          <List />
        </Tree.FilterProvider>
      </Tree.Root>,
    );
    expect(warn).toHaveBeenCalledWith(misplaced('FilterProvider'));
    expect(screen.getByTestId('a')).toBeInTheDocument();
  });

  it('warns when a provider without children is rendered inside the root', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(
      <Tree.Root defaultItems={items}>
        <Tree.FilterProvider defaultValue="b" />
        <List />
      </Tree.Root>,
    );
    expect(warn).toHaveBeenCalledWith(misplaced('FilterProvider'));
  });

  it('warns for a misplaced provider even when the same provider wraps another tree', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(
      <React.Fragment>
        <Tree.FilterProvider defaultValue="b">
          <Tree.Root defaultItems={items}>
            <List />
          </Tree.Root>
        </Tree.FilterProvider>
        <Tree.Root defaultItems={items}>
          <Tree.FilterProvider defaultValue="b">
            <Tree.List>
              {(item) => (
                <Tree.Item itemId={item.id}>
                  <Tree.ItemContent />
                </Tree.Item>
              )}
            </Tree.List>
          </Tree.FilterProvider>
        </Tree.Root>
      </React.Fragment>,
    );
    expect(warn).toHaveBeenCalledWith(misplaced('FilterProvider'));
  });

  it('applies a provider to a root nested in another root', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(
      <Tree.Root defaultItems={[]}>
        <Tree.FilterProvider defaultValue="b">
          <Tree.Root defaultItems={items}>
            <List />
          </Tree.Root>
        </Tree.FilterProvider>
      </Tree.Root>,
    );
    expect(warn).not.toHaveBeenCalled();
    expect(screen.queryByTestId('a')).toBeNull();
  });

  it('does not warn for a provider whose nested root renders later', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    function App({ open }: { open: boolean }) {
      return (
        <Tree.Root defaultItems={[]}>
          <Tree.FilterProvider defaultValue="b">
            {open && (
              <Tree.Root defaultItems={items}>
                <List />
              </Tree.Root>
            )}
          </Tree.FilterProvider>
        </Tree.Root>
      );
    }
    const view = await render(<App open={false} />);
    await view.rerender(<App open />);
    expect(warn).not.toHaveBeenCalled();
    expect(screen.queryByTestId('a')).toBeNull();
  });

  it('applies a provider wrapping the root', async () => {
    await render(
      <Tree.FilterProvider defaultValue="b">
        <Tree.Root defaultItems={items}>
          <List />
        </Tree.Root>
      </Tree.FilterProvider>,
    );
    expect(screen.queryByTestId('a')).toBeNull();
    expect(screen.getByTestId('b')).toBeInTheDocument();
  });
});
