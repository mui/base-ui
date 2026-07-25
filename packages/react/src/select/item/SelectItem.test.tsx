import { expect, vi } from 'vitest';
import * as React from 'react';
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

describe('<Select.Item />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Item value="" />, () => ({
    refInstanceof: window.HTMLDivElement,
    button: true,
    render(node) {
      return render(<Select.Root open>{node}</Select.Root>);
    },
  }));

  it('treats a null value as an empty selection in multiple mode', async () => {
    const handleValueChange = vi.fn();

    // A controlled multiple select can legitimately be handed `null` (for example while its
    // value is still loading) instead of an array.
    const { user } = await render(
      <Select.Root multiple value={null} onValueChange={handleValueChange}>
        <Select.Trigger data-testid="trigger">
          <Select.Value />
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

    await user.click(screen.getByTestId('trigger'));

    const option = await screen.findByRole('option', { name: 'one' });
    expect(option).toHaveAttribute('aria-selected', 'false');

    await user.click(option);

    expect(handleValueChange).toHaveBeenCalledWith(['one'], expect.anything());
  });

  it('keeps the selection while grouped items are reordered and inserted', async () => {
    // `useCompositeListItem({ guess: true })` guesses each index from render order and lets the
    // commit flush correct it. Grouping, reordering and late insertion all invalidate the guess,
    // so this pins that a corrected index still resolves back to the right item.
    function App() {
      const [items, setItems] = React.useState(['b', 'c']);
      const [reversed, setReversed] = React.useState(false);
      const ordered = reversed ? [...items].reverse() : items;

      return (
        <div>
          <Select.Root open defaultValue="b">
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Group>
                    <Select.GroupLabel>Group one</Select.GroupLabel>
                    {ordered.map((itemValue) => (
                      <Select.Item key={itemValue} value={itemValue}>
                        <Select.ItemText>{itemValue}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Group>
                  <Select.Group>
                    <Select.GroupLabel>Group two</Select.GroupLabel>
                    <Select.Item value="z">
                      <Select.ItemText>z</Select.ItemText>
                    </Select.Item>
                  </Select.Group>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
          <button data-testid="prepend" onClick={() => setItems((prev) => ['a', ...prev])}>
            Prepend
          </button>
          <button data-testid="reverse" onClick={() => setReversed((prev) => !prev)}>
            Reverse
          </button>
        </div>
      );
    }

    const { user } = await render(<App />);

    await user.click(screen.getByTestId('prepend'));
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'a' })).not.toBe(null);
    });

    await user.click(screen.getByTestId('reverse'));
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('data-selected');
    });

    await user.click(screen.getByTestId('reverse'));
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('data-selected');
    });
  });

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

    expect(value.textContent).toBe('');

    fireEvent.click(trigger);

    await flushMicrotasks();

    fireEvent.click(screen.getByText('one'));

    await flushMicrotasks();

    expect(value.textContent).toBe('one');

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
      expect(screen.getByRole('listbox')).not.toBe(null);
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
      expect(screen.getByTestId('value').textContent).toBe('two');
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
    expect(screen.getByTestId('value').textContent).toBe('');
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

    expect(screen.getByTestId('value').textContent).toBe('one');
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should select an unhighlighted item with the mouse', async () => {
    await render(
      <Select.Root defaultOpen highlightItemOnHover={false}>
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

    const option = screen.getByRole('option', { name: 'two' });

    expect(option).not.toHaveAttribute('data-highlighted');

    fireEvent.pointerDown(option, { pointerType: 'mouse' });
    fireEvent.mouseDown(option);
    fireEvent.mouseUp(option);
    fireEvent.click(option, { detail: 1 });

    await waitFor(() => {
      expect(screen.getByTestId('value').textContent).toBe('two');
    });
  });

  it('should highlight a hovered item and commit it with a mouse click', async () => {
    const onValueChange = vi.fn();

    await render(
      <Select.Root onValueChange={onValueChange}>
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

    fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
    fireEvent.mouseDown(trigger);
    fireEvent.pointerUp(trigger, { pointerType: 'mouse' });
    fireEvent.mouseUp(trigger);
    fireEvent.click(trigger);
    await flushMicrotasks();

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBe(null);
    });

    const option = screen.getByRole('option', { name: 'two' });

    fireEvent.pointerEnter(option, { pointerType: 'mouse' });
    fireEvent.mouseMove(option);

    await waitFor(() => {
      expect(option).toHaveAttribute('data-highlighted');
    });

    fireEvent.pointerDown(option, { pointerType: 'mouse' });
    fireEvent.mouseDown(option);
    fireEvent.pointerUp(option, { pointerType: 'mouse' });
    fireEvent.mouseUp(option);
    fireEvent.click(option);
    await flushMicrotasks();

    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith('two', expect.anything());
    await waitFor(() => {
      expect(screen.getByTestId('value').textContent).toBe('two');
    });
  });

  it('should ignore an unhighlighted item with a generic virtual click', async () => {
    await render(
      <Select.Root defaultOpen highlightItemOnHover={false}>
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

    const option = screen.getByRole('option', { name: 'two' });

    expect(option).not.toHaveAttribute('data-highlighted');

    fireEvent.click(option, { detail: 0 });
    await flushMicrotasks();

    expect(screen.getByTestId('value').textContent).toBe('');
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

  it.skipIf(isJSDOM)(
    'should allow pointer click after a typeahead sequence that ends with Space',
    async () => {
      const { user } = await render(
        <Select.Root defaultOpen>
          <Select.Trigger data-testid="trigger">
            <Select.Value data-testid="value" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="one">Item One</Select.Item>
                <Select.Item value="two">Item Two</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const [firstItem, secondItem] = screen.getAllByRole('option');

      await act(async () => {
        firstItem.focus();
      });

      await user.keyboard('item t ');

      await waitFor(() => {
        expect(secondItem).toHaveFocus();
      });

      await user.click(secondItem);

      await waitFor(() => {
        expect(screen.getByTestId('value').textContent).toBe('two');
      });
    },
  );

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

      expect(value.textContent).toBe('Select font');

      // Open on mousedown and keep the mouse button "held" (no mouseup yet).
      fireEvent.mouseDown(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBe(null);
      });

      const option = screen.getByRole('option', { name: 'Sans-serif' });
      fireEvent.mouseMove(option);

      // Release quickly over an unselected option.
      await clock.tickAsync(250);
      fireEvent.mouseUp(option);

      await waitFor(() => {
        expect(value.textContent).toBe('Select font');
      });
    });

    it('should not select an unselected item within the selected delay when aligned with the trigger', async () => {
      ignoreActWarnings();

      await renderFakeTimers(
        <Select.Root defaultValue="one">
          <Select.Trigger data-testid="trigger">
            <Select.Value data-testid="value" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner alignItemWithTrigger>
              <Select.Popup>
                <Select.Item value="one">one</Select.Item>
                <Select.Item value="two">two</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      const value = screen.getByTestId('value');

      expect(value.textContent).toBe('one');

      fireEvent.mouseDown(trigger);
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBe(null));

      const option = screen.getByRole('option', { name: 'two' });
      await clock.tickAsync(250);
      fireEvent.mouseUp(option);

      expect(value.textContent).toBe('one');
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
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBe(null));

      const option = screen.getByRole('option', { name: 'one' });
      fireEvent.pointerEnter(option, { pointerType: 'mouse' });
      for (let i = 0; i < 4; i += 1) {
        fireEvent.pointerMove(option, {
          pointerType: 'mouse',
          buttons: 1,
          movementY: 2,
        });
      }

      // Real pointer movement over the item allows drag-to-select before the opening delay elapses.
      await act(async () => {
        await clock.tickAsync(100);
      });
      fireEvent.mouseUp(option);

      await waitFor(() => expect(screen.getByTestId('value').textContent).toBe('one'));
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('does not fire click handlers on a disabled item during drag-to-select', async () => {
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
                <Select.Item value="one" disabled onClick={handleClick}>
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
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBe(null));

      const option = screen.getByRole('option', { name: 'one' });
      fireEvent.pointerEnter(option, { pointerType: 'mouse' });
      for (let i = 0; i < 4; i += 1) {
        fireEvent.pointerMove(option, { pointerType: 'mouse', buttons: 1, movementY: 2 });
      }

      await act(async () => {
        await clock.tickAsync(100);
      });
      fireEvent.mouseUp(option);

      await flushMicrotasks();

      // Releasing over a disabled item must not synthesize a click on it at all.
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not select a disabled item via drag-to-select', async () => {
      ignoreActWarnings();
      const handleValueChange = vi.fn();

      await renderFakeTimers(
        <Select.Root onValueChange={handleValueChange}>
          <Select.Trigger data-testid="trigger">
            <Select.Value data-testid="value" placeholder="Select font" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Item value="one" disabled>
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
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBe(null));

      const option = screen.getByRole('option', { name: 'one' });
      fireEvent.pointerEnter(option, { pointerType: 'mouse' });
      for (let i = 0; i < 4; i += 1) {
        fireEvent.pointerMove(option, {
          pointerType: 'mouse',
          buttons: 1,
          movementY: 2,
        });
      }

      await act(async () => {
        await clock.tickAsync(100);
      });
      fireEvent.mouseUp(option);

      await flushMicrotasks();

      expect(handleValueChange).not.toHaveBeenCalled();
      expect(screen.getByTestId('value').textContent).toBe('Select font');
    });

    it('should not select on mouseup that follows a touch interaction', async () => {
      ignoreActWarnings();
      const handleValueChange = vi.fn();

      await renderFakeTimers(
        <Select.Root onValueChange={handleValueChange}>
          <Select.Trigger data-testid="trigger">
            <Select.Value data-testid="value" placeholder="Select font" />
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

      const trigger = screen.getByTestId('trigger');
      fireEvent.mouseDown(trigger);
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBe(null));

      const option = screen.getByRole('option', { name: 'one' });
      // A touch drag over the item: the synthesized mouseup must not commit a selection,
      // otherwise scrolling the popup with a finger would pick whatever is released over.
      fireEvent.pointerEnter(option, { pointerType: 'touch' });

      await act(async () => {
        await clock.tickAsync(500);
      });
      fireEvent.mouseUp(option);

      await flushMicrotasks();

      expect(handleValueChange).not.toHaveBeenCalled();
      expect(screen.getByTestId('value').textContent).toBe('Select font');
    });

    it('should accumulate drag-to-select movement across items', async () => {
      ignoreActWarnings();

      await renderFakeTimers(
        <Select.Root defaultValue="one">
          <Select.Trigger data-testid="trigger">
            <Select.Value data-testid="value" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner alignItemWithTrigger>
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
      fireEvent.mouseDown(trigger);
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBe(null));

      const optionTwo = screen.getByRole('option', { name: 'two' });
      fireEvent.pointerEnter(optionTwo, { pointerType: 'mouse' });
      fireEvent.pointerMove(optionTwo, {
        pointerType: 'mouse',
        buttons: 1,
        movementY: 4,
      });

      const optionThree = screen.getByRole('option', { name: 'three' });
      fireEvent.pointerEnter(optionThree, { pointerType: 'mouse' });
      fireEvent.pointerMove(optionThree, {
        pointerType: 'mouse',
        buttons: 1,
        movementY: 4,
      });

      await act(async () => {
        await clock.tickAsync(100);
      });
      fireEvent.mouseUp(optionThree);

      await waitFor(() => expect(screen.getByTestId('value').textContent).toBe('three'));
    });

    it('should select via drag-to-select when hover highlighting is disabled', async () => {
      ignoreActWarnings();

      await renderFakeTimers(
        <Select.Root highlightItemOnHover={false}>
          <Select.Trigger data-testid="trigger">
            <Select.Value data-testid="value" placeholder="Select font" />
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

      const trigger = screen.getByTestId('trigger');
      fireEvent.mouseDown(trigger);
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBe(null));

      const option = screen.getByRole('option', { name: 'two' });
      fireEvent.pointerEnter(option, { pointerType: 'mouse' });
      fireEvent.pointerMove(option, {
        pointerType: 'mouse',
        buttons: 1,
        movementY: 8,
      });

      expect(option).not.toHaveAttribute('data-highlighted');

      await act(async () => {
        await clock.tickAsync(500);
      });
      fireEvent.mouseUp(option);

      await waitFor(() => expect(screen.getByTestId('value').textContent).toBe('two'));
    });

    it('should not treat small pointer movement as drag-to-select', async () => {
      ignoreActWarnings();

      await renderFakeTimers(
        <Select.Root defaultValue="one">
          <Select.Trigger data-testid="trigger">
            <Select.Value data-testid="value" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner alignItemWithTrigger>
              <Select.Popup>
                <Select.Item value="one">one</Select.Item>
                <Select.Item value="two">two</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      const value = screen.getByTestId('value');

      expect(value.textContent).toBe('one');

      fireEvent.mouseDown(trigger);
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBe(null));

      const option = screen.getByRole('option', { name: 'two' });
      fireEvent.pointerEnter(option, { pointerType: 'mouse' });
      fireEvent.pointerMove(option, {
        pointerType: 'mouse',
        buttons: 1,
        movementY: 2,
      });

      await act(async () => {
        await clock.tickAsync(100);
      });
      fireEvent.mouseUp(option);

      expect(value.textContent).toBe('one');
    });

    it('should allow small pointer movement to select after the opening delay', async () => {
      ignoreActWarnings();

      await renderFakeTimers(
        <Select.Root defaultValue="one">
          <Select.Trigger data-testid="trigger">
            <Select.Value data-testid="value" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner alignItemWithTrigger>
              <Select.Popup>
                <Select.Item value="one">one</Select.Item>
                <Select.Item value="two">two</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      fireEvent.mouseDown(trigger);
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBe(null));

      const option = screen.getByRole('option', { name: 'two' });
      fireEvent.pointerEnter(option, { pointerType: 'mouse' });
      fireEvent.pointerMove(option, {
        pointerType: 'mouse',
        buttons: 1,
        movementY: 2,
      });

      await act(async () => {
        await clock.tickAsync(500);
      });
      fireEvent.mouseUp(option);

      await waitFor(() => expect(screen.getByTestId('value').textContent).toBe('two'));
    });

    it('should ignore an opening click that did not start on the item', async () => {
      ignoreActWarnings();

      await renderFakeTimers(
        <Select.Root highlightItemOnHover={false}>
          <Select.Trigger data-testid="trigger">
            <Select.Value data-testid="value" placeholder="Select font" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner alignItemWithTrigger>
              <Select.Popup>
                <Select.Item value="one">one</Select.Item>
                <Select.Item value="two">two</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );

      const trigger = screen.getByTestId('trigger');
      fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
      fireEvent.mouseDown(trigger);
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBe(null));

      const option = screen.getByRole('option', { name: 'one' });
      fireEvent.mouseUp(option);
      fireEvent.click(option, { detail: 1 });

      expect(screen.getByTestId('value').textContent).toBe('Select font');
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
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBe(null));

      const option = screen.getByRole('option', { name: 'one' });
      fireEvent.pointerEnter(option, { pointerType: 'mouse' });
      fireEvent.pointerMove(option, {
        pointerType: 'mouse',
        buttons: 1,
        movementY: 8,
      });

      // Wait past the delay gates and release the mouse over the option
      await act(async () => {
        await clock.tickAsync(500);
      });
      fireEvent.mouseUp(option);

      expect(handleClick).toHaveBeenCalledOnce();
      expect(screen.getByTestId('value').textContent).toBe('Select font');
      expect(screen.queryByRole('listbox')).not.toBe(null);
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

      expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('data-highlighted', '');
      expect(screen.getByRole('option', { name: 'b' })).not.toHaveAttribute('data-highlighted');

      await user.keyboard('{ArrowDown}');
      await flushMicrotasks();

      expect(screen.getByRole('option', { name: 'a' })).not.toHaveAttribute('data-highlighted');
      expect(screen.getByRole('option', { name: 'b' })).toHaveAttribute('data-highlighted', '');
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
        expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('data-selected', '');
      });
      expect(screen.getByRole('option', { name: 'b' })).not.toHaveAttribute('data-selected');
    });
  });
});
