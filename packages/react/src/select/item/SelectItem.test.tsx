import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import { fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';
import { expect } from 'chai';

describe('<Select.Item />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Item value="" />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Select.Root open>{node}</Select.Root>);
    },
  }));

  it('should select the item and close popup when clicked', async () => {
    await render(
      <Select.Root>
        <Select.Trigger data-testid="trigger">
          <Select.Value placeholder="null" data-testid="value" />
        </Select.Trigger>
        <Select.Positioner data-testid="positioner">
          <Select.Item value="one">one</Select.Item>
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

    await flushMicrotasks();

    expect(value.textContent).to.equal('one');

    expect(positioner).not.toBeVisible();
  });

  it('navigating with keyboard should highlight item', async () => {
    const { user } = await render(
      <Select.Root>
        <Select.Trigger data-testid="trigger">
          <Select.Value />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.Item value="one">one</Select.Item>
            <Select.Item value="two">two</Select.Item>
            <Select.Item value="three">three</Select.Item>
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

  it('should select item when Enter key is pressed', async function test(t = {}) {
    if (!/jsdom/.test(window.navigator.userAgent)) {
      // @ts-expect-error to support mocha and vitest
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this?.skip?.() || t?.skip();
    }

    const { user } = await render(
      <Select.Root>
        <Select.Trigger data-testid="trigger">
          <Select.Value placeholder="null" data-testid="value" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.Item value="one">one</Select.Item>
            <Select.Item value="two">two</Select.Item>
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

  it('should not select disabled item', async () => {
    await render(
      <Select.Root>
        <Select.Trigger data-testid="trigger">
          <Select.Value data-testid="value" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.Item value="one">one</Select.Item>
            <Select.Item value="two" disabled>
              two
            </Select.Item>
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

  it('should focus the selected item upon opening the popup', async () => {
    const { user } = await render(
      <Select.Root>
        <Select.Trigger data-testid="trigger">
          <Select.Value data-testid="value" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.Item value="one">one</Select.Item>
            <Select.Item value="two">two</Select.Item>
            <Select.Item value="three">three</Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );

    const trigger = screen.getByTestId('trigger');

    await user.click(trigger);

    await flushMicrotasks();

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowUp}');
    await user.keyboard('{ArrowUp}');

    await user.click(screen.getByRole('option', { name: 'three' }));
    await user.click(trigger);

    await flushMicrotasks();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'three', hidden: false })).toHaveFocus();
    });
  });

  describe('style hooks', () => {
    it('should apply data-highlighted attribute when item is highlighted', async function test(t = {}) {
      if (!/jsdom/.test(window.navigator.userAgent)) {
        // @ts-expect-error to support mocha and vitest
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this?.skip?.() || t?.skip();
      }

      const { user } = await render(
        <Select.Root defaultValue="a">
          <Select.Trigger data-testid="trigger" />
          <Select.Positioner>
            <Select.Popup>
              <Select.Item value="a">a</Select.Item>
              <Select.Item value="b">b</Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      const attr = 'data-highlighted';

      fireEvent.click(trigger);

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'a' })).to.have.attribute(attr, '');
      expect(screen.getByRole('option', { name: 'b' })).not.to.have.attribute(attr);

      await user.keyboard('{ArrowDown}');
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'a' })).not.to.have.attribute(attr);
      expect(screen.getByRole('option', { name: 'b' })).to.have.attribute(attr, '');
    });

    it('should apply data-selected attribute when item is selected', async () => {
      await render(
        <Select.Root>
          <Select.Trigger data-testid="trigger" />
          <Select.Positioner>
            <Select.Popup>
              <Select.Item value="a">a</Select.Item>
              <Select.Item value="b">b</Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      const attr = 'data-selected';

      fireEvent.click(trigger);

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'a' })).not.to.have.attribute(attr);
      expect(screen.getByRole('option', { name: 'b' })).not.to.have.attribute(attr);

      fireEvent.click(screen.getByRole('option', { name: 'a' }));

      await flushMicrotasks();

      fireEvent.click(trigger);

      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'a' })).to.have.attribute(attr, '');
      expect(screen.getByRole('option', { name: 'b' })).not.to.have.attribute(attr);
    });
  });
});
