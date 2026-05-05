import { expect, vi } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Combobox.Item />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Item />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Combobox.Root>{node}</Combobox.Root>);
    },
  }));

  it('selects item and closes in single mode', async () => {
    await render(
      <Combobox.Root defaultOpen>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="one">one</Combobox.Item>
                <Combobox.Item value="two">two</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    fireEvent.click(screen.getByRole('option', { name: 'two' }));
    await flushMicrotasks();

    expect(input).toHaveValue('two');
    expect(screen.queryByRole('listbox')).toBe(null);
  });

  describe('prop: onClick', () => {
    it('calls onClick when clicked with a pointer', async () => {
      const handleClick = vi.fn();
      const { user } = await render(
        <Combobox.Root items={['apple', 'banana']} openOnInputClick>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item: string) => (
                    <Combobox.Item key={item} value={item} onClick={handleClick}>
                      {item}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      await user.click(input);

      const option = screen.getByRole('option', { name: 'banana' });
      await user.click(option);

      expect(handleClick.mock.calls.length).toBe(1);
    });

    it('calls onClick when selected with Enter key (via root interaction)', async () => {
      const handleClick = vi.fn();
      const { user } = await render(
        <Combobox.Root items={['one', 'two']} openOnInputClick>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {(item: string) => (
                    <Combobox.Item key={item} value={item} onClick={handleClick}>
                      {item}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByTestId('input');
      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.toBe(null));

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(handleClick.mock.calls.length).toBe(1);
    });

    it('does not select the item when onClick prevents Base UI handler', async () => {
      const handleClick = vi.fn((event) => event.preventBaseUIHandler());
      const { user } = await render(
        <Combobox.Root defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="one" onClick={handleClick}>
                    one
                  </Combobox.Item>
                  <Combobox.Item value="two">two</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const option = screen.getByRole('option', { name: 'one' });
      await user.click(option);
      await flushMicrotasks();

      const input = screen.getByTestId('input');
      expect(handleClick.mock.calls.length).toBe(1);
      expect(input).toHaveValue('');
      expect(screen.queryByRole('listbox')).not.toBe(null);
    });
  });

  it('does not select disabled item', async () => {
    await render(
      <Combobox.Root defaultOpen>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="one">one</Combobox.Item>
                <Combobox.Item value="two" disabled>
                  two
                </Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    fireEvent.click(screen.getByRole('option', { name: 'two' }));
    await flushMicrotasks();

    expect(input).toHaveValue('');
  });

  it('Enter selects highlighted item', async () => {
    const { user } = await render(
      <Combobox.Root>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="one">one</Combobox.Item>
                <Combobox.Item value="two">two</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    await user.click(input);
    await waitFor(() => expect(screen.getByRole('listbox')).not.toBe(null));
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(input).toHaveValue('one'));
    expect(screen.queryByRole('listbox')).toBe(null);
  });

  it.skipIf(isJSDOM)('keeps the input focused after selecting an item with touch', async () => {
    const { user } = await render(
      <Combobox.Root defaultOpen>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="one">one</Combobox.Item>
                <Combobox.Item value="two">two</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    await user.click(input);
    expect(input).toHaveFocus();

    const option = screen.getByRole('option', { name: 'two' });

    await user.pointer([
      { target: option, keys: '[TouchA>]', pointerName: 'touch' },
      { target: option, keys: '[/TouchA]', pointerName: 'touch' },
    ]);

    await waitFor(() => expect(input).toHaveValue('two'));
    expect(input).toHaveFocus();
  });

  it('prevents default on mousedown so pointer selection does not steal input focus', async () => {
    await render(
      <Combobox.Root defaultOpen>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="one">one</Combobox.Item>
                <Combobox.Item value="two">two</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const option = screen.getByRole('option', { name: 'two' });
    const mouseDown = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      button: 0,
    });

    option.dispatchEvent(mouseDown);

    expect(mouseDown.defaultPrevented).toBe(true);
  });

  it('multiple mode toggles selection and stays open', async () => {
    const { user } = await render(
      <Combobox.Root multiple>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="a">a</Combobox.Item>
                <Combobox.Item value="b">b</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    await user.click(input);
    await waitFor(() => {
      expect(screen.getByRole('listbox')).not.toBe(null);
    });

    const a = screen.getByRole('option', { name: 'a' });
    await user.click(a);
    expect(a).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('listbox')).not.toBe(null);

    await user.click(a);
    expect(a).not.toHaveAttribute('aria-selected', 'true');
  });

  it('reflects selected value with aria-selected when reopening', async () => {
    const { user } = await render(
      <Combobox.Root defaultValue="two">
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="one">one</Combobox.Item>
                <Combobox.Item value="two">two</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByTestId('input');
    await user.click(input);
    await waitFor(() => expect(screen.getByRole('listbox')).not.toBe(null));
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'two' })).toHaveAttribute('aria-selected', 'true'),
    );
  });

  describe.skipIf(!isJSDOM)('link handling', () => {
    it('clicking a link inside an item does not select or close (anchor with href)', async () => {
      const { user } = await render(
        <Combobox.Root defaultOpen>
          <Combobox.Input />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item
                    value="one"
                    render={<a href="/somewhere" />}
                    data-testid="link-one"
                  >
                    one
                  </Combobox.Item>
                  <Combobox.Item value="two">two</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      const link = screen.getByTestId('link-one');

      await user.click(link);

      await waitFor(() => expect(input.value).toBe(''));
      expect(screen.queryByRole('listbox')).not.toBe(null);
    });

    it('clicking a hash link inside an item does not select and closes popup (anchor with #hash)', async () => {
      const { user } = await render(
        <Combobox.Root defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="one" render={<a href="#section" />} data-testid="link-hash">
                    one
                  </Combobox.Item>
                  <Combobox.Item value="two">two</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      const link = screen.getByTestId('link-hash');

      await user.click(link);

      await waitFor(() => expect(input.value).toBe(''));
      expect(screen.queryByRole('listbox')).toBe(null);
    });

    it('clicking an anchor without href behaves like normal item (selects and closes)', async () => {
      const { user } = await render(
        <Combobox.Root defaultOpen>
          <Combobox.Input data-testid="input" />
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  <Combobox.Item value="one" render={<a />} data-testid="anchor-no-href">
                    one
                  </Combobox.Item>
                  <Combobox.Item value="two">two</Combobox.Item>
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');

      await user.click(screen.getByTestId('anchor-no-href'));

      await waitFor(() => expect(input.value).toBe('one'));
      expect(screen.queryByRole('listbox')).toBe(null);
    });
  });
});
