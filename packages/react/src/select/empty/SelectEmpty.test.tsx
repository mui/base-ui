import * as React from 'react';
import { expect } from 'vitest';
import { Select } from '@base-ui/react/select';
import { createRenderer, describeConformance } from '#test-utils';
import { screen, waitFor } from '@mui/internal-test-utils';
import { INITIAL_LIVE_REGION_TEXT_MUTATION_RESET_DELAY } from '../../internals/useInitialLiveRegionTextMutation';

describe('<Select.Empty />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Empty />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                {node}
                <Select.List />
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );
    },
  }));

  it('renders its children when no items are registered', async () => {
    await render(
      <Select.Root open>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Empty data-testid="empty">No items</Select.Empty>
              <Select.List />
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    expect(screen.getByTestId('empty')).toHaveTextContent('No items');
    expect(screen.getByTestId('empty')).toHaveAttribute('role', 'status');
    expect(screen.getByTestId('empty')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByTestId('empty')).toHaveAttribute('aria-atomic', 'true');
  });

  it('does not render its children when an item is registered', async () => {
    await render(
      <Select.Root open>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Empty data-testid="empty">No items</Select.Empty>
              <Select.List>
                <Select.Item value="apple">Apple</Select.Item>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    expect(screen.getByTestId('empty')).toBeEmptyDOMElement();
  });

  it('updates when items are added and removed', async () => {
    function App() {
      const [items, setItems] = React.useState<string[]>([]);

      return (
        <React.Fragment>
          <button type="button" onClick={() => setItems(['apple'])}>
            Add item
          </button>
          <button type="button" onClick={() => setItems([])}>
            Remove items
          </button>
          <Select.Root open>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Empty data-testid="empty">No items</Select.Empty>
                  <Select.List>
                    {items.map((item) => (
                      <Select.Item key={item} value={item}>
                        {item}
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </React.Fragment>
      );
    }

    const { user } = await render(<App />);

    expect(screen.getByTestId('empty')).toHaveTextContent('No items');

    await user.click(screen.getByRole('button', { name: 'Add item' }));
    expect(screen.getByTestId('empty')).toBeEmptyDOMElement();

    await user.click(screen.getByRole('button', { name: 'Remove items' }));
    expect(screen.getByTestId('empty')).toHaveTextContent('No items');
  });

  it('uses the latest registered items after reopening a force-mounted popup', async () => {
    function App() {
      const [items, setItems] = React.useState(['apple']);

      return (
        <React.Fragment>
          <button type="button" onClick={() => setItems([])}>
            Clear items
          </button>
          <button type="button" onClick={() => setItems(['apple'])}>
            Add item
          </button>
          <Select.Root>
            <Select.Trigger aria-label="Toggle select">Toggle select</Select.Trigger>
            <Select.Portal>
              <Select.Positioner data-testid="positioner" alignItemWithTrigger={false}>
                <Select.Popup>
                  <Select.Empty data-testid="empty">No items</Select.Empty>
                  <Select.List>
                    {items.map((item) => (
                      <Select.Item key={item} value={item}>
                        {item}
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </React.Fragment>
      );
    }

    const { user } = await render(<App />);
    const trigger = screen.getByRole('combobox', { name: 'Toggle select' });

    await user.click(trigger);
    expect(screen.getByTestId('empty')).toBeEmptyDOMElement();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
    expect(screen.getByTestId('positioner')).toHaveAttribute('hidden');

    await user.click(screen.getByRole('button', { name: 'Clear items' }));
    await user.click(trigger);
    expect(screen.getByTestId('empty')).toHaveTextContent('No items');

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await user.click(screen.getByRole('button', { name: 'Add item' }));
    await user.click(trigger);
    expect(screen.getByTestId('empty')).toBeEmptyDOMElement();
  });

  it('counts grouped and disabled items as registered items', async () => {
    await render(
      <Select.Root open>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Empty data-testid="empty">No items</Select.Empty>
              <Select.List>
                <Select.Group>
                  <Select.GroupLabel>Unavailable</Select.GroupLabel>
                  <Select.Item value="apple" disabled>
                    Apple
                  </Select.Item>
                </Select.Group>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    expect(screen.getByTestId('empty')).toBeEmptyDOMElement();
  });

  it('uses registered items rather than the root items prop as its source of truth', async () => {
    const { rerender } = await render(
      <Select.Root items={[{ label: 'Apple', value: 'apple' }]} open>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Empty data-testid="empty">No items</Select.Empty>
              <Select.List />
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    expect(screen.getByTestId('empty')).toHaveTextContent('No items');

    await rerender(
      <Select.Root items={[]} open>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Empty data-testid="empty">No items</Select.Empty>
              <Select.List>
                <Select.Item value="apple">Apple</Select.Item>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    expect(screen.getByTestId('empty')).toBeEmptyDOMElement();
  });

  describe('a11y', () => {
    const { render: renderWithFakeTimers, clock } = createRenderer();

    clock.withFakeTimers();

    it('announces initially rendered content and preserves a custom render element', async () => {
      await renderWithFakeTimers(
        <Select.Root open>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Empty render={<p data-testid="empty" />}>No items</Select.Empty>
                <Select.List />
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      expect(screen.getByTestId('empty').tagName).toBe('P');
      expect(screen.getByTestId('empty').textContent).toBe('No items\u2060');

      clock.tick(INITIAL_LIVE_REGION_TEXT_MUTATION_RESET_DELAY);

      expect(screen.getByTestId('empty')).toHaveTextContent('No items');
    });
  });
});
