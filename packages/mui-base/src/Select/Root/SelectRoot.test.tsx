import * as React from 'react';
import * as Select from '@base_ui/react/Select';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';

describe('<Select.Root />', () => {
  const { render } = createRenderer();

  describe('prop: defaultValue', () => {
    it('should select the option by default', async () => {
      await render(
        <Select.Root defaultValue="b" animated={false}>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Positioner>
            <Select.Popup>
              <Select.Option value="a">a</Select.Option>
              <Select.Option value="b">b</Select.Option>
            </Select.Popup>
          </Select.Positioner>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      fireEvent.click(trigger);

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b', hidden: false })).to.have.attribute(
        'data-selected',
        'true',
      );
    });
  });

  describe('prop: value', () => {
    it('should select the option specified by the value prop', async () => {
      await render(
        <Select.Root value="b" animated={false}>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Positioner>
            <Select.Popup>
              <Select.Option value="a">a</Select.Option>
              <Select.Option value="b">b</Select.Option>
            </Select.Popup>
          </Select.Positioner>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      fireEvent.click(trigger);

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b', hidden: false })).to.have.attribute(
        'data-selected',
        'true',
      );
    });

    it('should update the selected option when the value prop changes', async () => {
      const { setProps } = await render(
        <Select.Root value="a" animated={false}>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Positioner>
            <Select.Popup>
              <Select.Option value="a">a</Select.Option>
              <Select.Option value="b">b</Select.Option>
            </Select.Popup>
          </Select.Positioner>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      fireEvent.click(trigger);

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'a', hidden: false })).to.have.attribute(
        'data-selected',
        'true',
      );

      setProps({ value: 'b' });

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'b', hidden: false })).to.have.attribute(
        'data-selected',
        'true',
      );
    });
  });

  describe('prop: onValueChange', () => {
    it('should call onValueChange when an option is selected', async () => {
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
            animated={false}
          >
            <Select.Trigger data-testid="trigger">
              <Select.Value />
            </Select.Trigger>
            <Select.Positioner>
              <Select.Popup>
                <Select.Option value="a">a</Select.Option>
                <Select.Option value="b">b</Select.Option>
              </Select.Popup>
            </Select.Positioner>
          </Select.Root>
        );
      }

      const { user } = await render(<App />);

      const trigger = screen.getByTestId('trigger');

      fireEvent.click(trigger);

      await flushMicrotasks();

      await user.click(screen.getByRole('option', { name: 'b', hidden: false }));

      expect(handleValueChange.args[0][0]).to.equal('b');
    });
  });

  describe('prop: defaultOpen', () => {
    it('should open the select by default', async () => {
      await render(
        <Select.Root defaultOpen animated={false}>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Positioner>
            <Select.Popup>
              <Select.Option value="a">a</Select.Option>
              <Select.Option value="b">b</Select.Option>
            </Select.Popup>
          </Select.Positioner>
        </Select.Root>,
      );

      expect(screen.getByRole('listbox', { hidden: false })).toBeVisible();
    });
  });

  describe('prop: open', () => {
    it('should control the open state of the select', async () => {
      function ControlledSelect({ open }: { open: boolean }) {
        return (
          <Select.Root open={open} animated={false}>
            <Select.Trigger data-testid="trigger">
              <Select.Value />
            </Select.Trigger>
            <Select.Positioner>
              <Select.Popup>
                <Select.Option value="a">a</Select.Option>
                <Select.Option value="b">b</Select.Option>
              </Select.Popup>
            </Select.Positioner>
          </Select.Root>
        );
      }

      const { rerender } = await render(<ControlledSelect open={false} />);

      expect(screen.queryByRole('listbox')).to.equal(null);

      rerender(<ControlledSelect open />);

      await flushMicrotasks();

      expect(screen.getByRole('listbox', { hidden: false })).toBeVisible();
    });
  });

  describe('prop: onOpenChange', () => {
    it('should call onOpenChange when the select is opened or closed', async () => {
      const handleOpenChange = spy();

      const { user } = await render(
        <Select.Root onOpenChange={handleOpenChange} animated={false}>
          <Select.Trigger data-testid="trigger">
            <Select.Value />
          </Select.Trigger>
          <Select.Positioner>
            <Select.Popup>
              <Select.Option value="a">a</Select.Option>
              <Select.Option value="b">b</Select.Option>
            </Select.Popup>
          </Select.Positioner>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');

      await user.click(trigger);
      expect(handleOpenChange.callCount).to.equal(1);
      expect(handleOpenChange.args[0][0]).to.equal(true);

      await user.click(trigger);
      expect(handleOpenChange.callCount).to.equal(2);
      expect(handleOpenChange.args[1][0]).to.equal(false);
    });
  });
});
