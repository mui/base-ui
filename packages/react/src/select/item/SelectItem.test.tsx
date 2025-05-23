import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
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
          <Select.Value data-testid="value">null</Select.Value>
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
          <Select.Value>value</Select.Value>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Item value="one">one</Select.Item>
              <Select.Item value="two">two</Select.Item>
              <Select.Item value="three">three</Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    fireEvent.click(screen.getByTestId('trigger'));
    await flushMicrotasks();

    await waitFor(() => {
      expect(screen.getByText('one')).toHaveFocus();
    });

    await user.keyboard('{ArrowDown}');

    await waitFor(() => {
      expect(screen.getByText('two')).toHaveFocus();
    });
  });

  it('should select item when Enter key is pressed', async ({ skip }) => {
    if (!isJSDOM) {
      skip();
    }

    const { user } = await render(
      <Select.Root>
        <Select.Trigger data-testid="trigger">
          <Select.Value data-testid="value">null</Select.Value>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Item value="one">one</Select.Item>
              <Select.Item value="two">two</Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    fireEvent.click(screen.getByTestId('trigger'));
    await flushMicrotasks();

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('value').textContent).to.equal('two');
    });
  });

  it('should focus disabled items', async () => {
    await render(
      <Select.Root open>
        <Select.Trigger data-testid="trigger">
          <Select.Value data-testid="value">value</Select.Value>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Item value="two" disabled>
                two
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    const item = screen.getByText('two');
    await act(() => item.focus());
    await waitFor(() => {
      expect(item).toHaveFocus();
    });
  });

  it('should not select disabled item', async () => {
    await render(
      <Select.Root>
        <Select.Trigger data-testid="trigger">
          <Select.Value data-testid="value">value</Select.Value>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Item value="one">one</Select.Item>
              <Select.Item value="two" disabled>
                two
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    fireEvent.click(screen.getByTestId('trigger'));
    await flushMicrotasks();

    fireEvent.click(screen.getByText('two'));
    expect(screen.getByTestId('value').textContent).to.equal('value');
  });

  it('should focus the selected item upon opening the popup', async () => {
    const { user } = await render(
      <Select.Root>
        <Select.Trigger data-testid="trigger">
          <Select.Value data-testid="value">one</Select.Value>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Item value="one">one</Select.Item>
              <Select.Item value="two">two</Select.Item>
              <Select.Item value="three">three</Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    const trigger = screen.getByTestId('trigger');

    fireEvent.click(trigger);
    await user.click(screen.getByRole('option', { name: 'three' }));
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'three' })).toHaveFocus();
    });
  });

  it('should use Select.ItemText for display value, ignoring other child content when no explicit label is provided', async () => {
    const { user } = await render(
      <Select.Root>
        <Select.Trigger data-testid="trigger">
          <Select.Value data-testid="value">placeholder</Select.Value>
        </Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.Item value="complex" data-testid="complex-item">
              <Select.ItemText>primary</Select.ItemText>
              <svg aria-hidden>
                <desc>svg</desc>
              </svg>
              <span>secondary</span>
            </Select.Item>
            <Select.Item value="simple" data-testid="simple-item">
              <Select.ItemText>other item</Select.ItemText>
            </Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );

    expect(screen.getByTestId('value').textContent).to.equal('placeholder');

    fireEvent.click(screen.getByTestId('trigger'));
    await flushMicrotasks();

    const primary = screen.getByTestId('complex-item');
    await user.click(primary);

    expect(screen.getByTestId('value').textContent).to.equal('primary');
  });

  it('should prioritize explicit item label prop over Select.ItemText for display value', async () => {
    const { user } = await render(
      <Select.Root>
        <Select.Trigger data-testid="trigger">
          <Select.Value data-testid="value">placeholder</Select.Value>
        </Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.Item value="complex" data-testid="complex-item">
              <Select.ItemText>primary</Select.ItemText>
              <svg aria-hidden>
                <desc>svg</desc>
              </svg>
              <span>secondary</span>
            </Select.Item>
            <Select.Item value="simple" data-testid="simple-item">
              <Select.ItemText>other item</Select.ItemText>
            </Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>,
    );

    expect(screen.getByTestId('value').textContent).to.equal('placeholder');

    fireEvent.click(screen.getByTestId('trigger'));
    await flushMicrotasks();

    const primary = screen.getByTestId('complex-item');
    await user.click(primary);
    expect(screen.getByTestId('value').textContent).to.equal('primary');

    await user.keyboard('{ArrowDown}');
    await user.click(screen.getByTestId('simple-item'));
    expect(screen.getByTestId('value').textContent).to.equal('other item');
  });

  describe('style hooks', () => {
    it('should apply data-highlighted attribute when item is highlighted', async ({ skip }) => {
      if (!isJSDOM) {
        skip();
      }

      const { user } = await render(
        <Select.Root defaultValue="a">
          <Select.Trigger data-testid="trigger" />
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

      fireEvent.click(screen.getByTestId('trigger'));
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'a' })).to.have.attribute('data-highlighted', '');
      expect(screen.getByRole('option', { name: 'b' })).not.to.have.attribute('data-highlighted');

      await user.keyboard('{ArrowDown}');
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'a' })).not.to.have.attribute('data-highlighted');
      expect(screen.getByRole('option', { name: 'b' })).to.have.attribute('data-highlighted', '');
    });

    it('should apply data-selected attribute when item is selected', async () => {
      await render(
        <Select.Root>
          <Select.Trigger data-testid="trigger" />
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

      fireEvent.click(screen.getByTestId('trigger'));
      await flushMicrotasks();

      fireEvent.click(screen.getByRole('option', { name: 'a' }));

      await flushMicrotasks();

      fireEvent.click(screen.getByTestId('trigger'));
      await flushMicrotasks();
      expect(screen.getByRole('option', { name: 'a' })).to.have.attribute('data-selected', '');
      expect(screen.getByRole('option', { name: 'b' })).not.to.have.attribute('data-selected');
    });
  });
});
