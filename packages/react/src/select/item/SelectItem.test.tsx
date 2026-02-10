import { Select } from '@base-ui/react/select';
import {
  act,
  fireEvent,
  flushMicrotasks,
  ignoreActWarnings,
  screen,
  waitFor,
} from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { expect, vi } from 'vitest';

describe('<Select.Item />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Item value="" />, () => ({
    refInstanceof: window.HTMLDivElement,
    button: true,
    render(node) {
      return render(<Select.Root open>{node}</Select.Root>);
    },
  }));

  it('should select the item and close popup when clicked', async () => {
    ignoreActWarnings();
    await render(
      <Select.Root>
        <Select.Trigger data-testid="trigger">
          <Select.Value data-testid="value" />
        </Select.Trigger>
        <Select.Positioner data-testid="positioner">
          <Select.Item value="one">one</Select.Item>
        </Select.Positioner>
      </Select.Root>,
    );

    const value = screen.getByTestId('value');
    const trigger = screen.getByTestId('trigger');
    const positioner = screen.getByTestId('positioner');

    expect(value.textContent).to.equal('');

    fireEvent.click(trigger);

    await flushMicrotasks();

    fireEvent.click(screen.getByText('one'));

    await flushMicrotasks();

    expect(value.textContent).to.equal('one');

    expect(positioner).not.toBeVisible();
  });

  it.skipIf(!isJSDOM)('navigating with keyboard should focus item', async () => {
    const { user } = await render(
      <Select.Root>
        <Select.Trigger data-testid="trigger">
          <Select.Value />
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
      expect(screen.getByRole('listbox')).not.to.equal(null);
    });
    await waitFor(() => {
      expect(screen.getByText('one')).toHaveFocus();
    });

    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(screen.getByText('two')).toHaveFocus();
    });

    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(screen.getByText('three')).toHaveFocus();
    });
  });

  it.skipIf(!isJSDOM)('should select item when Enter key is pressed', async () => {
    const { user } = await render(
      <Select.Root>
        <Select.Trigger data-testid="trigger">
          <Select.Value data-testid="value" />
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
          <Select.Value data-testid="value" />
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
          <Select.Value data-testid="value" />
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
    expect(screen.getByTestId('value').textContent).to.equal('');
  });

  it('should call onClick exactly once for a regular click', async () => {
    const handleClick = vi.fn();

    await render(
      <Select.Root>
        <Select.Trigger data-testid="trigger">
          <Select.Value data-testid="value" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.Item value="one" onClick={handleClick}>
                one
              </Select.Item>
              <Select.Item value="two">two</Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    fireEvent.click(screen.getByTestId('trigger'));
    await flushMicrotasks();

    fireEvent.click(screen.getByRole('option', { name: 'one' }));
    await flushMicrotasks();

    expect(screen.getByTestId('value').textContent).to.equal('one');
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should focus the selected item upon opening the popup', async () => {
    const { user } = await render(
      <Select.Root>
        <Select.Trigger data-testid="trigger">
          <Select.Value data-testid="value" />
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

  describe.skipIf(!isJSDOM)('quick selection', () => {
    const { render: renderFakeTimers, clock } = createRenderer({
      clockOptions: {
        shouldAdvanceTime: true,
      },
    });

    clock.withFakeTimers();

    it('should not select an item on quick mouseup when showing a placeholder (no null item)', async () => {
      ignoreActWarnings();
      const fonts = [
        { label: 'Sans-serif', value: 'sans' },
        { label: 'Serif', value: 'serif' },
        { label: 'Monospace', value: 'mono' },
        { label: 'Cursive', value: 'cursive' },
      ];

      await renderFakeTimers(
        <Select.Root items={fonts}>
          <Select.Trigger data-testid="trigger">
            <Select.Value data-testid="value" placeholder="Select font" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                {fonts.map(({ label, value }) => (
                  <Select.Item key={value} value={value}>
                    {label}
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      const value = screen.getByTestId('value');

      expect(value.textContent).to.equal('Select font');

      // Open on mousedown and keep the mouse button "held" (no mouseup yet).
      fireEvent.mouseDown(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.to.equal(null);
      });

      const option = screen.getByRole('option', { name: 'Sans-serif' });
      fireEvent.mouseMove(option);

      // Release quickly over an unselected option.
      await clock.tickAsync(250);
      fireEvent.mouseUp(option);

      await waitFor(() => {
        expect(value.textContent).to.equal('Select font');
      });
    });

    it('should call onClick when selecting via drag-to-select (mousedown on trigger, mouseup on item)', async () => {
      ignoreActWarnings();
      const handleClick = vi.fn();

      await renderFakeTimers(
        <Select.Root>
          <Select.Trigger data-testid="trigger">
            <Select.Value data-testid="value" placeholder="Select font" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="one" onClick={handleClick}>
                  one
                </Select.Item>
                <Select.Item value="two">two</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      fireEvent.mouseDown(trigger);
      await waitFor(() => expect(screen.queryByRole('listbox')).not.to.equal(null));

      const option = screen.getByRole('option', { name: 'one' });
      fireEvent.pointerEnter(option, { pointerType: 'mouse' });
      fireEvent.pointerMove(option, { pointerType: 'mouse' });

      // Wait past the delay gates and release the mouse over the option
      await act(async () => {
        await clock.tickAsync(500);
      });
      fireEvent.mouseUp(option);

      await waitFor(() => expect(screen.getByTestId('value').textContent).to.equal('one'));
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('should not select item when onClick calls preventBaseUIHandler during drag-to-select', async () => {
      ignoreActWarnings();
      const handleClick = vi.fn((event) => event.preventBaseUIHandler());

      await renderFakeTimers(
        <Select.Root>
          <Select.Trigger data-testid="trigger">
            <Select.Value data-testid="value" placeholder="Select font" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="one" onClick={handleClick}>
                  one
                </Select.Item>
                <Select.Item value="two">two</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      fireEvent.mouseDown(trigger);
      await waitFor(() => expect(screen.queryByRole('listbox')).not.to.equal(null));

      const option = screen.getByRole('option', { name: 'one' });
      fireEvent.pointerEnter(option, { pointerType: 'mouse' });
      fireEvent.pointerMove(option, { pointerType: 'mouse' });

      // Wait past the delay gates and release the mouse over the option
      await act(async () => {
        await clock.tickAsync(500);
      });
      fireEvent.mouseUp(option);

      expect(handleClick).toHaveBeenCalledOnce();
      expect(screen.getByTestId('value').textContent).to.equal('Select font');
      expect(screen.queryByRole('listbox')).not.to.equal(null);
    });
  });

  describe.skipIf(!isJSDOM)('style hooks', () => {
    it('should apply data-highlighted attribute when item is highlighted', async () => {
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
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'a' })).to.have.attribute('data-selected', '');
      });
      expect(screen.getByRole('option', { name: 'b' })).not.to.have.attribute('data-selected');
    });
  });
});
