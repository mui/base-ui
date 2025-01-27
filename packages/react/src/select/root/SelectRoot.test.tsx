import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import { fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, popupConformanceTests } from '#test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';

describe('<Select.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  popupConformanceTests({
    createComponent: (props) => (
      <Select.Root {...props.root}>
        <Select.Trigger {...props.trigger}>
          <Select.Value />
        </Select.Trigger>
        <Select.Portal {...props.portal}>
          <Select.Positioner>
            <Select.Popup {...props.popup}>
              <Select.Item>Item</Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    ),
    triggerMouseAction: 'click',
    render,
    expectedPopupRole: 'listbox',
    alwaysMounted: true,
  });

  describe('prop: defaultValue', () => {
    it('should select the item by default', async () => {
      await render(
        <Select.Root defaultValue="b">
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      fireEvent.click(trigger);

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b', hidden: false })).to.have.attribute(
        'data-selected',
        '',
      );
    });
  });

  describe('prop: value', () => {
    it('should select the item specified by the value prop', async () => {
      await render(
        <Select.Root value="b">
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      fireEvent.click(trigger);

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b', hidden: false })).to.have.attribute(
        'data-selected',
        '',
      );
    });

    it('should update the selected item when the value prop changes', async () => {
      const { setProps } = await render(
        <Select.Root value="a">
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      fireEvent.click(trigger);

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'a', hidden: false })).to.have.attribute(
        'data-selected',
        '',
      );

      setProps({ value: 'b' });

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b', hidden: false })).to.have.attribute(
        'data-selected',
        '',
      );
    });
  });

  describe('prop: onValueChange', () => {
    it('should call onValueChange when an item is selected', async () => {
      const handleValueChange = spy();

      function App() {
        const [value, setValue] = React.useState('');

        return (
          <Select.Root
            value={value}
            onValueChange={(newValue) => {
              setValue(newValue);
              handleValueChange(newValue);
            }}
          >
            <Select.Trigger data-testid="trigger">
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="a">a</Select.Item>
                  <Select.Item value="b">b</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        );
      }

      const { user } = await render(<App />);

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);

      await flushMicrotasks();

      const option = await screen.findByRole('option', { name: 'b', hidden: false });

      await user.click(option);

      expect(handleValueChange.args[0][0]).to.equal('b');
    });
  });

  describe('prop: defaultOpen', () => {
    it('should open the select by default', async () => {
      await render(
        <Select.Root defaultOpen>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      expect(screen.getByRole('listbox', { hidden: false })).toBeVisible();
    });
  });

  describe('prop: onOpenChange', () => {
    it('should call onOpenChange when the select is opened or closed', async () => {
      const handleOpenChange = spy();

      const { user } = await render(
        <Select.Root onOpenChange={handleOpenChange}>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="a">a</Select.Item>
                <Select.Item value="b">b</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      expect(handleOpenChange.callCount).to.equal(1);
      expect(handleOpenChange.args[0][0]).to.equal(true);
    });
  });

  it('should handle browser autofill', async () => {
    const { container } = await render(
      <Select.Root name="select">
        <Select.Trigger data-testid="trigger">
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Item value="a">a</Select.Item>
              <Select.Item value="b">b</Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    const trigger = screen.getByTestId('trigger');

    fireEvent.click(trigger);

    await flushMicrotasks();

    fireEvent.change(container.querySelector('[name="select"]')!, { target: { value: 'b' } });

    await flushMicrotasks();

    expect(screen.getByRole('option', { name: 'b', hidden: false })).to.have.attribute(
      'data-selected',
      '',
    );
  });

  describe('prop: modal', () => {
    it('should render an internal backdrop when `true`', async () => {
      const { user } = await render(
        <div>
          <Select.Root>
            <Select.Trigger data-testid="trigger">Open</Select.Trigger>
            <Select.Portal>
              <Select.Positioner data-testid="positioner">
                <Select.Popup>
                  <Select.Item>1</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
          <button>Outside</button>
        </div>,
      );

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.to.equal(null);
      });

      const positioner = screen.getByTestId('positioner');

      expect(positioner.previousElementSibling).to.have.attribute('role', 'presentation');
    });

    it('should not render an internal backdrop when `false`', async () => {
      const { user } = await render(
        <div>
          <Select.Root modal={false}>
            <Select.Trigger data-testid="trigger">Open</Select.Trigger>
            <Select.Portal>
              <Select.Positioner data-testid="positioner">
                <Select.Popup>
                  <Select.Item>1</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
          <button>Outside</button>
        </div>,
      );

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.to.equal(null);
      });

      const positioner = screen.getByTestId('positioner');

      expect(positioner.previousElementSibling).to.equal(null);
    });
  });
});
