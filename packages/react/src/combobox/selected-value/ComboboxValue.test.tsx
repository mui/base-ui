import * as React from 'react';
import { expect } from 'chai';
import { screen } from '@mui/internal-test-utils';
import { Combobox } from '@base-ui-components/react/combobox';
import { createRenderer } from '#test-utils';

describe('<Combobox.Value />', () => {
  const { render } = createRenderer();

  it('renders current selected value via function child', async () => {
    await render(
      <Combobox.Root defaultValue="b">
        <Combobox.Value>{(val) => <div data-testid="value">{val}</div>}</Combobox.Value>
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

    expect(screen.getByTestId('value')).to.have.text('b');
  });

  it('renders null item label from items array when no value selected', async () => {
    const items = [
      { value: null, label: 'Select item' },
      { value: 'a', label: 'A' },
    ];

    await render(
      <Combobox.Root items={items}>
        <Combobox.Trigger>
          <Combobox.Value />
        </Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value={null}>Select item</Combobox.Item>
                <Combobox.Item value="a">A</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    expect(screen.getByText('Select item')).not.to.equal(null);
  });
});
