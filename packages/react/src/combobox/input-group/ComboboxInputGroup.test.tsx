import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance } from '#test-utils';
import { expect } from 'vitest';
import { screen, waitFor } from '@mui/internal-test-utils';

describe('<Combobox.InputGroup />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.InputGroup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Combobox.Root items={['a']}>{node}</Combobox.Root>);
    },
  }));

  it('should not dismiss the popup when clicking inside the input group', async () => {
    const { user } = await render(
      <Combobox.Root items={['a', 'b']}>
        <Combobox.InputGroup style={{ padding: 10 }}>
          <span data-testid="pad">padding</span>
          <Combobox.Input />
          <Combobox.Trigger>Open</Combobox.Trigger>
        </Combobox.InputGroup>

        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="a">a</Combobox.Item>
                <Combobox.Item value="b">b</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByRole('listbox')).not.to.equal(null);

    await user.click(screen.getByTestId('pad'));
    expect(screen.queryByRole('listbox')).not.to.equal(null);
  });

  it('has role prop', async () => {
    await render(
      <Combobox.Root items={['a']}>
        <Combobox.InputGroup />
      </Combobox.Root>,
    );

    expect(screen.queryByRole('group')).not.to.equal(null);
  });

  it('removes highlighted state when opening with keyboard navigation', async () => {
    const { user } = await render(
      <Combobox.Root items={['a', 'b']}>
        <Combobox.InputGroup data-testid="group">
          <Combobox.Input />
        </Combobox.InputGroup>

        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="a">a</Combobox.Item>
                <Combobox.Item value="b">b</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const group = screen.getByTestId('group');
    expect(group).to.have.attribute('data-highlighted');

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}');

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.to.equal(null);
      expect(group).not.to.have.attribute('data-highlighted');
    });
  });

  it('keeps highlighted state when items are highlighted by pointer', async () => {
    const { user } = await render(
      <Combobox.Root items={['a', 'b']}>
        <Combobox.InputGroup data-testid="group">
          <Combobox.Input />
        </Combobox.InputGroup>

        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="a">a</Combobox.Item>
                <Combobox.Item value="b">b</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const group = screen.getByTestId('group');

    await user.click(screen.getByRole('combobox'));
    const option = await screen.findByRole('option', { name: 'a' });
    await user.hover(option);

    await waitFor(() => {
      expect(option).to.have.attribute('data-highlighted');
      expect(group).to.have.attribute('data-highlighted');
    });
  });

  it('restores highlighted state when the popup closes after keyboard highlight', async () => {
    const { user } = await render(
      <Combobox.Root items={['a', 'b']}>
        <Combobox.InputGroup data-testid="group">
          <Combobox.Input />
        </Combobox.InputGroup>

        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="a">a</Combobox.Item>
                <Combobox.Item value="b">b</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const group = screen.getByTestId('group');

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}');

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.to.equal(null);
      expect(group).not.to.have.attribute('data-highlighted');
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).to.equal(null);
      expect(group).to.have.attribute('data-highlighted');
    });
  });
});
