import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import { createRenderer, describeConformance } from '#test-utils';
import { expect } from 'vitest';
import { spy } from 'sinon';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';

describe('<Select.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Trigger />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Select.Root open>{node}</Select.Root>);
    },
  }));

  describe('disabled state', () => {
    it('cannot be focused when disabled', async () => {
      const { user } = await render(
        <Select.Root defaultValue="b">
          <Select.Trigger data-testid="trigger" disabled>
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
      expect(trigger).to.have.attribute('data-disabled');

      await user.keyboard('[Tab]');

      expect(expect(document.activeElement)).to.not.equal(trigger);
    });

    it('does not toggle the popup when disabled', async () => {
      const handleOpenChange = spy();
      await render(
        <Select.Root defaultValue="b" onOpenChange={handleOpenChange}>
          <Select.Trigger data-testid="trigger" disabled>
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

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).to.equal(null);
      });
      expect(handleOpenChange.callCount).to.equal(0);
    });
  });

  describe('style hooks', () => {
    it('should have the data-popup-open and data-pressed attributes when open', async () => {
      await render(
        <Select.Root>
          <Select.Trigger />
        </Select.Root>,
      );

      const trigger = screen.getByRole('combobox');

      await act(async () => {
        trigger.click();
      });

      expect(trigger).to.have.attribute('data-popup-open');
      expect(trigger).to.have.attribute('data-pressed');
    });
  });
});
