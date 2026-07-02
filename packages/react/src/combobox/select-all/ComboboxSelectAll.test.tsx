import { expect, vi } from 'vitest';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance } from '#test-utils';
import { fireEvent, screen } from '@mui/internal-test-utils';

function renderSelectAllList(node: React.ReactNode) {
  return (
    <Combobox.Root items={['a', 'b']} multiple defaultOpen>
      <Combobox.Input />
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.List>
              {node}
              {(item: string) => (
                <Combobox.Item key={item} value={item}>
                  {item}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

describe('<Combobox.SelectAll />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.SelectAll />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(renderSelectAllList(node));
    },
  }));

  it('selects all filtered items when clicked', async () => {
    const onValueChange = vi.fn();
    const { user } = await render(
      <Combobox.Root items={['a', 'b', 'c']} multiple defaultOpen onValueChange={onValueChange}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.SelectAll />
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    await user.click(screen.getByRole('option', { name: 'Select all' }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0][0]).toEqual(['a', 'b', 'c']);
  });

  it('selects all filtered items when activated with the keyboard', async () => {
    const onValueChange = vi.fn();
    const { user } = await render(
      <Combobox.Root items={['a', 'b', 'c']} multiple defaultOpen onValueChange={onValueChange}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.SelectAll />
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0][0]).toEqual(['a', 'b', 'c']);
  });

  it('deselects all filtered items when all are selected', async () => {
    const onValueChange = vi.fn();
    const { user } = await render(
      <Combobox.Root
        items={['a', 'b', 'c']}
        multiple
        defaultOpen
        defaultValue={['a', 'b', 'c']}
        onValueChange={onValueChange}
      >
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.SelectAll />
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const selectAll = screen.getByRole('option', { name: 'Select all' });
    expect(selectAll).toHaveAttribute('aria-selected', 'true');

    await user.click(selectAll);

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0][0]).toEqual([]);
  });

  it('shows unselected state when some filtered items are selected', async () => {
    await render(
      <Combobox.Root items={['a', 'b', 'c']} multiple defaultOpen defaultValue={['a']}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.SelectAll data-testid="select-all" />
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const selectAll = screen.getByTestId('select-all');
    expect(selectAll).toHaveAttribute('aria-selected', 'false');
  });

  it('selects only filtered items when a query is applied', async () => {
    const onValueChange = vi.fn();
    const { user } = await render(
      <Combobox.Root
        items={['apple', 'banana', 'cherry']}
        multiple
        defaultOpen
        onValueChange={onValueChange}
      >
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.SelectAll />
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'a');

    await user.click(screen.getByRole('option', { name: 'Select all' }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0][0]).toEqual(['apple', 'banana']);
  });

  it('does not add the sentinel value to the selected value', async () => {
    const onValueChange = vi.fn();
    const { user } = await render(
      <Combobox.Root items={['a', 'b']} multiple defaultOpen onValueChange={onValueChange}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.SelectAll />
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    await user.click(screen.getByRole('option', { name: 'Select all' }));

    expect(onValueChange.mock.calls[0][0]).toEqual(['a', 'b']);
    expect(onValueChange.mock.calls[0][0]).not.toContain(expect.any(Symbol));
  });

  it('is disabled when root is disabled and does nothing on click', async () => {
    const onValueChange = vi.fn();
    await render(
      <Combobox.Root items={['a', 'b']} multiple defaultOpen disabled onValueChange={onValueChange}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.SelectAll data-testid="select-all" />
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const selectAll = screen.getByTestId('select-all');
    expect(selectAll).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(selectAll);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('when root is readOnly it does nothing on click', async () => {
    const onValueChange = vi.fn();
    await render(
      <Combobox.Root items={['a', 'b']} multiple defaultOpen readOnly onValueChange={onValueChange}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.SelectAll data-testid="select-all" />
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    fireEvent.click(screen.getByTestId('select-all'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('is disabled in single selection mode', async () => {
    await render(
      <Combobox.Root items={['a', 'b']} defaultOpen>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.SelectAll data-testid="select-all" />
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    expect(screen.getByTestId('select-all')).toHaveAttribute('aria-disabled', 'true');
  });
});
