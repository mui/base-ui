import * as React from 'react';
import * as Select from '@base_ui/react/Select';
import { fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';
import { expect } from 'chai';

describe('<Select.Option />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Option value="" />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open animated={false}>
          {node}
        </Select.Root>,
      );
    },
  }));

  it('should select the option and close popup when clicked', async () => {
    await render(
      <Select.Root animated={false}>
        <Select.Trigger data-testid="trigger">
          <Select.Value placeholder="null" data-testid="value" />
        </Select.Trigger>
        <Select.Positioner data-testid="positioner">
          <Select.Option value="one">one</Select.Option>
        </Select.Positioner>
      </Select.Root>,
    );

    const value = screen.getByTestId('value');
    const trigger = screen.getByTestId('trigger');
    const positioner = screen.getByTestId('positioner');

    expect(value.textContent).to.equal('null');

    fireEvent.click(trigger);

    await flushMicrotasks();

    fireEvent.click(screen.getByText('one'));

    expect(value.textContent).to.equal('one');

    expect(positioner).not.toBeVisible();
  });

  it('navigating with keyboard should highlight option', async () => {
    const { user } = await render(
      <Select.Root animated={false}>
        <Select.Trigger data-testid="trigger">
          <Select.Value />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.Option value="one">one</Select.Option>
            <Select.Option value="two">two</Select.Option>
            <Select.Option value="three">three</Select.Option>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );

    const trigger = screen.getByTestId('trigger');

    fireEvent.click(trigger);

    await flushMicrotasks();

    await waitFor(() => {
      expect(screen.getByText('one')).toHaveFocus();
    });

    await user.keyboard('{ArrowDown}');

    await waitFor(() => {
      expect(screen.getByText('two')).toHaveFocus();
    });
  });

  it('should select option when Enter key is pressed', async function test() {
    if (!/jsdom/.test(window.navigator.userAgent)) {
      this.skip();
    }

    const { user } = await render(
      <Select.Root animated={false}>
        <Select.Trigger data-testid="trigger">
          <Select.Value placeholder="null" data-testid="value" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.Option value="one">one</Select.Option>
            <Select.Option value="two">two</Select.Option>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );

    const trigger = screen.getByTestId('trigger');
    const value = screen.getByTestId('value');

    fireEvent.click(trigger);

    await flushMicrotasks();

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(value.textContent).to.equal('two');
    });
  });

  it('should not select disabled option', async () => {
    await render(
      <Select.Root animated={false}>
        <Select.Trigger data-testid="trigger">
          <Select.Value data-testid="value" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.Option value="one">one</Select.Option>
            <Select.Option value="two" disabled>
              two
            </Select.Option>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );

    const trigger = screen.getByTestId('trigger');
    const value = screen.getByTestId('value');

    fireEvent.click(trigger);

    await flushMicrotasks();

    fireEvent.click(screen.getByText('two'));

    expect(value.textContent).to.equal('');
  });

  it('should focus the selected option upon opening the popup', async () => {
    const { user } = await render(
      <Select.Root animated={false}>
        <Select.Trigger data-testid="trigger">
          <Select.Value data-testid="value" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.Option value="one">one</Select.Option>
            <Select.Option value="two">two</Select.Option>
            <Select.Option value="three">three</Select.Option>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );

    const trigger = screen.getByTestId('trigger');

    fireEvent.click(trigger);

    await flushMicrotasks();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'one' })).toHaveFocus();
    });

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowUp}');
    await user.keyboard('{ArrowUp}');

    fireEvent.click(screen.getByRole('option', { name: 'three' }));
    fireEvent.click(trigger);

    await flushMicrotasks();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'three', hidden: false })).toHaveFocus();
    });
  });

  describe('style hooks', () => {
    it('should apply data-highlighted attribute when option is highlighted', async () => {
      const { user } = await render(
        <Select.Root animated={false}>
          <Select.Trigger data-testid="trigger" />
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

      expect(screen.getByRole('option', { name: 'a' })).to.have.attribute(
        'data-highlighted',
        'true',
      );
      expect(screen.getByRole('option', { name: 'b' })).not.to.have.attribute('data-highlighted');

      await user.keyboard('{ArrowDown}');

      expect(screen.getByRole('option', { name: 'b' })).to.have.attribute(
        'data-highlighted',
        'true',
      );
      expect(screen.getByRole('option', { name: 'a' })).not.to.have.attribute('data-highlighted');
    });

    it('should apply data-selected attribute when option is selected', async () => {
      await render(
        <Select.Root animated={false}>
          <Select.Trigger data-testid="trigger" />
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

      expect(screen.getByRole('option', { name: 'a', hidden: false })).not.to.have.attribute(
        'data-selected',
      );
      expect(screen.getByRole('option', { name: 'b', hidden: false })).not.to.have.attribute(
        'data-selected',
      );

      fireEvent.click(screen.getByRole('option', { name: 'a', hidden: false }));

      fireEvent.click(trigger);

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'a', hidden: false })).to.have.attribute(
        'data-selected',
        'true',
      );
      expect(screen.getByRole('option', { name: 'b', hidden: false })).not.to.have.attribute(
        'data-selected',
      );
    });
  });
});