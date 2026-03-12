import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance } from '#test-utils';
import { expect } from 'vitest';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { spy } from 'sinon';

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

  it('focuses the input and opens when clicking input-group padding around chips', async () => {
    await render(
      <Combobox.Root items={['a', 'b']} multiple defaultValue={['a']}>
        <Combobox.InputGroup data-testid="group" style={{ padding: 10 }}>
          <Combobox.Chips>
            <Combobox.Chip>a</Combobox.Chip>
            <Combobox.Input data-testid="input" />
          </Combobox.Chips>
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
    const input = screen.getByTestId('input');

    fireEvent.mouseDown(group);

    expect(input).toHaveFocus();
    expect(screen.queryByRole('listbox')).not.to.equal(null);
  });

  it('does not handle chip presses a second time when chips are nested inside the input group', async () => {
    const onOpenChange = spy();

    await render(
      <Combobox.Root items={['a', 'b']} multiple defaultValue={['a']} onOpenChange={onOpenChange}>
        <Combobox.InputGroup>
          <Combobox.Chips>
            <Combobox.Chip data-testid="chip">a</Combobox.Chip>
            <Combobox.Input />
          </Combobox.Chips>
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

    fireEvent.mouseDown(screen.getByTestId('chip'));
    expect(onOpenChange.callCount).to.equal(1);
  });

  it('has role prop', async () => {
    await render(
      <Combobox.Root items={['a']}>
        <Combobox.InputGroup />
      </Combobox.Root>,
    );

    expect(screen.queryByRole('group')).not.to.equal(null);
  });
});
