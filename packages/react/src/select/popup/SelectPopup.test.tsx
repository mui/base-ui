import { expect } from 'chai';
import { Select } from '@base-ui-components/react/select';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open>
          <Select.Portal>
            <Select.Positioner>{node}</Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );
    },
  }));

  it('has aria attributes when no Select.List is present', async () => {
    const { user } = await render(
      <Select.Root multiple>
        <Select.Trigger>Trigger</Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup data-testid="popup">Popup</Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    const trigger = screen.getByRole('combobox');

    expect(trigger).not.to.have.attribute('aria-controls');
    expect(trigger).to.have.attribute('aria-expanded', 'false');

    await user.click(trigger);

    const popup = await screen.findByTestId('popup');
    const listbox = await screen.findByRole('listbox');

    expect(popup).to.equal(listbox);
    expect(popup.id).not.to.equal('');
    expect(popup).to.have.attribute('aria-multiselectable', 'true');
    expect(trigger).to.have.attribute('aria-controls', popup.id);
    expect(trigger).to.have.attribute('aria-expanded', 'true');
    expect(trigger).to.have.attribute('aria-haspopup', 'listbox');
  });

  it('places aria attributes on Select.List instead if it is present', async () => {
    const { user } = await render(
      <Select.Root multiple>
        <Select.Trigger>Trigger</Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup data-testid="popup">
              <Select.List data-testid="list">
                <Select.Item value="1">Item 1</Select.Item>
                <Select.Item value="2">Item 2</Select.Item>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    const trigger = screen.getByRole('combobox');

    expect(trigger).not.to.have.attribute('aria-controls');
    expect(trigger).to.have.attribute('aria-expanded', 'false');
    expect(trigger).to.have.attribute('aria-haspopup', 'listbox');

    await user.click(trigger);

    const popup = await screen.findByTestId('popup');
    const list = await screen.findByTestId('list');
    const listbox = await screen.findByRole('listbox');

    expect(list).to.equal(listbox);
    expect(list).to.have.attribute('aria-multiselectable');
    expect(popup).to.have.attribute('role', 'presentation');
    expect(popup).not.to.have.attribute('aria-multiselectable');
    expect(list.id).not.to.equal('');
    expect(trigger).to.have.attribute('aria-controls', list.id);
    expect(trigger).not.to.have.attribute('aria-controls', popup.id);
    expect(trigger).to.have.attribute('aria-expanded', 'true');
    expect(trigger).to.have.attribute('aria-haspopup', 'listbox');
  });
});
