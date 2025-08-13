import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import { createRenderer } from '#test-utils';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';

describe('<Combobox.SelectedValue />', () => {
  const { render } = createRenderer();

  it('renders current selected value via function child', async () => {
    await render(
      <Combobox.Root defaultSelectedValue="b">
        <Combobox.SelectedValue>
          {(val) => <div data-testid="value">{val}</div>}
        </Combobox.SelectedValue>
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
});
