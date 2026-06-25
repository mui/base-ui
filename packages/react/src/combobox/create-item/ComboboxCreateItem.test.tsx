import * as React from 'react';
import { expect, vi } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

const COLORS = ['apple', 'apricot', 'banana'];

function renderCreatable(
  options: {
    multiple?: boolean;
    onCreate?: (value: string, eventDetails: unknown) => void;
    onValueChange?: (value: any) => void;
    creatable?: boolean | ((query: string, items: readonly string[]) => boolean);
  } = {},
) {
  const {
    multiple = false,
    onCreate = () => {},
    onValueChange = () => {},
    creatable = true,
  } = options;

  return (
    <Combobox.Root
      items={COLORS}
      creatable={creatable as any}
      multiple={multiple as any}
      onValueChange={onValueChange as any}
    >
      <Combobox.Input data-testid="input" />
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.Empty>No results.</Combobox.Empty>
            <Combobox.List>
              {(item: string, _index: number, meta: { create: boolean }) =>
                meta.create ? (
                  <Combobox.CreateItem
                    key="__create__"
                    onCreate={(value, eventDetails) => onCreate(value, eventDetails)}
                    data-testid="create"
                  >
                    {(value) => `Create "${value}"`}
                  </Combobox.CreateItem>
                ) : (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )
              }
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

describe('<Combobox.CreateItem />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.CreateItem>{(q) => q}</Combobox.CreateItem>, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Combobox.Root items={['a']} creatable inputValue="new" defaultOpen>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>{node}</Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );
    },
  }));

  it('hides the create row when the query is empty', async () => {
    const { user } = await render(renderCreatable());

    const input = screen.getByTestId('input');
    await user.click(input);
    await waitFor(() => expect(screen.getByRole('listbox')).not.toBe(null));

    expect(screen.queryByTestId('create')).toBe(null);
  });

  it('shows the create row when the query has no exact match', async () => {
    const { user } = await render(renderCreatable());

    const input = screen.getByTestId('input');
    await user.click(input);
    await user.type(input, 'cherry');

    await waitFor(() => expect(screen.getByTestId('create')).not.toBe(null));
    expect(screen.getByTestId('create')).toHaveTextContent('Create "cherry"');
  });

  it('hides the create row when the query exactly matches an existing item', async () => {
    const { user } = await render(renderCreatable());

    const input = screen.getByTestId('input');
    await user.click(input);
    await user.type(input, 'banana');

    await flushMicrotasks();
    expect(screen.queryByTestId('create')).toBe(null);
  });

  it('appends the create row after the real filtered items', async () => {
    const { user } = await render(renderCreatable());

    const input = screen.getByTestId('input');
    await user.click(input);
    await user.type(input, 'ap');

    await waitFor(() => expect(screen.getByTestId('create')).not.toBe(null));

    const options = screen.getAllByRole('option');
    // apple, apricot, then the create row last
    expect(options).toHaveLength(3);
    expect(options[options.length - 1]).toHaveAttribute('data-testid', 'create');
  });

  it('fires onCreate on pointer click without committing a value (single mode)', async () => {
    const onCreate = vi.fn();
    const onValueChange = vi.fn();
    const { user } = await render(renderCreatable({ onCreate, onValueChange }));

    const input = screen.getByTestId('input');
    await user.click(input);
    await user.type(input, 'cherry');

    await waitFor(() => expect(screen.getByTestId('create')).not.toBe(null));
    await user.click(screen.getByTestId('create'));
    await flushMicrotasks();

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledWith('cherry', expect.anything());
    expect(onValueChange).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('listbox')).toBe(null));
  });

  it('reaches the create row with ArrowDown and fires onCreate on Enter', async () => {
    const onCreate = vi.fn();
    const onValueChange = vi.fn();
    const { user } = await render(renderCreatable({ onCreate, onValueChange }));

    const input = screen.getByTestId('input');
    await user.click(input);
    await user.type(input, 'ap');

    await waitFor(() => expect(screen.getByTestId('create')).not.toBe(null));

    // apple (0), apricot (1), create (2)
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');

    await waitFor(() => expect(screen.getByTestId('create')).toHaveAttribute('data-highlighted'));

    await user.keyboard('{Enter}');
    await flushMicrotasks();

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledWith('ap', expect.anything());
    expect(onValueChange).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('listbox')).toBe(null));
  });

  it('works in multiple selection mode', async () => {
    const onCreate = vi.fn();
    const onValueChange = vi.fn();
    const { user } = await render(renderCreatable({ multiple: true, onCreate, onValueChange }));

    const input = screen.getByTestId('input');
    await user.click(input);
    await user.type(input, 'cherry');

    await waitFor(() => expect(screen.getByTestId('create')).not.toBe(null));
    await user.click(screen.getByTestId('create'));
    await flushMicrotasks();

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledWith('cherry', expect.anything());
    expect(onValueChange).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('listbox')).toBe(null));
  });

  it('supports a custom creatable predicate for dedup', async () => {
    // Only show the create row when the query is longer than 3 characters.
    const creatable = (query: string) => query.length > 3;
    const { user } = await render(renderCreatable({ creatable }));

    const input = screen.getByTestId('input');
    await user.click(input);
    await user.type(input, 'ap');
    await flushMicrotasks();
    expect(screen.queryByTestId('create')).toBe(null);

    await user.type(input, 'ple2');
    await waitFor(() => expect(screen.getByTestId('create')).not.toBe(null));
  });

  it('does not affect a non-creatable combobox (2-arg render still works)', async () => {
    const { user } = await render(
      <Combobox.Root items={COLORS}>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
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

    const input = screen.getByTestId('input');
    await user.click(input);
    await user.type(input, 'cherry');
    await flushMicrotasks();

    expect(screen.queryByTestId('create')).toBe(null);
    expect(screen.queryByRole('option')).toBe(null);
  });

  describe('manual placement', () => {
    function ManualList(props: { onCreate: (value: string) => void }) {
      const filtered = Combobox.useFilteredItems<string>();
      return (
        <Combobox.List>
          {filtered.map((item) => (
            <Combobox.Item key={item} value={item}>
              {item}
            </Combobox.Item>
          ))}
          <Combobox.CreateItem onCreate={(value) => props.onCreate(value)} data-testid="create">
            {(value) => `Create "${value}"`}
          </Combobox.CreateItem>
        </Combobox.List>
      );
    }

    function renderManual(onCreate: (value: string) => void) {
      return (
        <Combobox.Root items={COLORS} creatable>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <ManualList onCreate={onCreate} />
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      );
    }

    it('self-hides on empty/duplicate query and shows otherwise', async () => {
      const { user } = await render(renderManual(() => {}));

      const input = screen.getByTestId('input');
      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.toBe(null));

      // Empty query: hidden.
      expect(screen.queryByTestId('create')).toBe(null);

      // Non-matching query: shown.
      await user.type(input, 'cherry');
      await waitFor(() => expect(screen.getByTestId('create')).not.toBe(null));

      // Exact duplicate query: hidden.
      await user.clear(input);
      await user.type(input, 'banana');
      await waitFor(() => expect(screen.queryByTestId('create')).toBe(null));
    });

    it('reaches the manually placed create row with the keyboard', async () => {
      const onCreate = vi.fn();
      const { user } = await render(renderManual(onCreate));

      const input = screen.getByTestId('input');
      await user.click(input);
      await user.type(input, 'ap');
      await waitFor(() => expect(screen.getByTestId('create')).not.toBe(null));

      // apple (0), apricot (1), create (2)
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      await waitFor(() => expect(screen.getByTestId('create')).toHaveAttribute('data-highlighted'));

      await user.keyboard('{Enter}');
      await flushMicrotasks();

      expect(onCreate).toHaveBeenCalledTimes(1);
      expect(onCreate).toHaveBeenCalledWith('ap');
    });
  });
});
