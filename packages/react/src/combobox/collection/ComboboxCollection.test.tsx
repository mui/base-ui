import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';
import { createRenderer } from '#test-utils';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';

describe('<Combobox.Collection />', () => {
  const { render } = createRenderer();

  it('renders filtered items', async () => {
    await render(
      <Combobox.Root items={['alpha', 'beta', 'alpine']} defaultOpen>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Collection>
                  {(item) => (
                    <Combobox.Item key={item} value={item} data-testid={`item-${item}`}>
                      {item}
                    </Combobox.Item>
                  )}
                </Combobox.Collection>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    expect(screen.getByTestId('item-alpha')).not.to.equal(null);
    expect(screen.getByTestId('item-beta')).not.to.equal(null);
    expect(screen.getByTestId('item-alpine')).not.to.equal(null);
  });

  it('uses group collection context when rendered inside a group', async () => {
    await render(
      <Combobox.Root defaultOpen>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Group items={['c']}>
                  <Combobox.GroupLabel />
                  <Combobox.Collection>
                    {(item) => (
                      <Combobox.Item key={item} value={item} data-testid={`group-item-${item}`}>
                        {item}
                      </Combobox.Item>
                    )}
                  </Combobox.Collection>
                </Combobox.Group>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    expect(screen.queryByTestId('group-item-a')).to.equal(null);
    expect(screen.queryByTestId('group-item-b')).to.equal(null);
    expect(screen.getByTestId('group-item-c')).not.to.equal(null);
  });
});
