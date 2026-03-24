import { expect } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance } from '#test-utils';
import { screen } from '@mui/internal-test-utils';

describe('<Combobox.Empty />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Empty />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Combobox.Root defaultOpen>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                {node}
                <Combobox.List />
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );
    },
  }));

  it('renders when there are no filtered items', async () => {
    await render(
      <Combobox.Root items={[]} defaultOpen>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Empty data-testid="empty">No results</Combobox.Empty>
              <Combobox.List>
                {(item) => (
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

    expect(screen.getByTestId('empty')).toHaveTextContent('No results');
    expect(screen.getByTestId('empty')).toHaveAttribute('role', 'status');
  });

  it('does not render when there are items', async () => {
    await render(
      <Combobox.Root items={['a']} defaultOpen>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Empty>No results</Combobox.Empty>
              <Combobox.List>
                {(item) => (
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

    expect(screen.queryByText('No results')).toBe(null);
  });

  it('renders when the search query matches no items', async () => {
    await render(
      <Combobox.Root items={['a', 'b', 'c']} defaultInputValue="d" defaultOpen>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Empty data-testid="empty">No results</Combobox.Empty>
              <Combobox.List>
                {(item) => (
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

    expect(screen.queryByText('No results')).not.toBe(null);
  });

  it('does not render when the search query matches an item', async () => {
    await render(
      <Combobox.Root items={['a', 'b', 'c']} defaultInputValue="c" defaultOpen>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Empty data-testid="empty">No results</Combobox.Empty>
              <Combobox.List>
                {(item) => (
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

    expect(screen.queryByText('No results')).toBe(null);
  });
});
