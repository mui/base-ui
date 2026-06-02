import { expect, vi } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance } from '#test-utils';
import { fireEvent, screen } from '@mui/internal-test-utils';

describe('<Combobox.SelectAll />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.SelectAll />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render(node) {
      return render(
        <Combobox.Root items={['a', 'b']} multiple defaultOpen>
          <Combobox.Input />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>{node}</Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );
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
              <Combobox.SelectAll />
              <Combobox.List>
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

    await user.click(screen.getByRole('checkbox', { name: 'Select all' }));

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
              <Combobox.SelectAll />
              <Combobox.List>
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

    const selectAll = screen.getByRole('checkbox', { name: 'Select all' });
    expect(selectAll).toHaveAttribute('aria-checked', 'true');

    await user.click(selectAll);

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0][0]).toEqual([]);
  });

  it('shows mixed state when some filtered items are selected', async () => {
    await render(
      <Combobox.Root items={['a', 'b', 'c']} multiple defaultOpen defaultValue={['a']}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.SelectAll data-testid="select-all" />
              <Combobox.List>
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
    expect(selectAll).toHaveAttribute('aria-checked', 'mixed');
    expect(selectAll).toHaveAttribute('data-indeterminate', '');
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
              <Combobox.SelectAll />
              <Combobox.List>
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

    await user.click(screen.getByRole('checkbox', { name: 'Select all' }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0][0]).toEqual(['apple', 'banana']);
  });

  it('is disabled when root is disabled and does nothing on click', async () => {
    const onValueChange = vi.fn();
    await render(
      <Combobox.Root items={['a', 'b']} multiple defaultOpen disabled onValueChange={onValueChange}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.SelectAll data-testid="select-all" />
              <Combobox.List>
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
    expect(selectAll).toHaveAttribute('disabled');

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
              <Combobox.SelectAll data-testid="select-all" />
              <Combobox.List>
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
              <Combobox.SelectAll data-testid="select-all" />
              <Combobox.List>
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

    expect(screen.getByTestId('select-all')).toHaveAttribute('disabled');
  });
});
