import { expect } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';

describe('<Combobox.Clear />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Clear />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render(node) {
      return render(
        <Combobox.Root defaultValue="a">
          <Combobox.Input />
          {node}
        </Combobox.Root>,
      );
    },
  }));

  it('renders in single mode when a value is selected', async () => {
    await render(
      <Combobox.Root defaultValue="a">
        <Combobox.Input />
        <Combobox.Clear data-testid="clear" />
      </Combobox.Root>,
    );
    expect(screen.getByTestId('clear')).not.toBe(null);
  });

  it('does not render without a value by default', async () => {
    await render(
      <Combobox.Root>
        <Combobox.Input />
        <Combobox.Clear data-testid="clear" />
      </Combobox.Root>,
    );

    expect(screen.queryByTestId('clear')).toBe(null);
  });

  it('renders and clears the typed value in no-selection mode', async () => {
    const { user } = await render(
      <Autocomplete.Root defaultValue="apple">
        <Autocomplete.Input />
        <Autocomplete.Clear data-testid="clear" />
      </Autocomplete.Root>,
    );

    const input = screen.getByRole<HTMLInputElement>('combobox');
    expect(input.value).toBe('apple');

    await user.click(screen.getByTestId('clear'));

    expect(input.value).toBe('');
    expect(input).toHaveFocus();
  });

  it('renders and clears chips in multiple mode', async () => {
    const { user } = await render(
      <Combobox.Root multiple defaultValue={['apple']}>
        <Combobox.Chips>
          <Combobox.Value>
            {(value: string[]) =>
              value.map((item) => <Combobox.Chip key={item}>{item}</Combobox.Chip>)
            }
          </Combobox.Value>
          <Combobox.Input />
        </Combobox.Chips>
        <Combobox.Clear data-testid="clear" />
      </Combobox.Root>,
    );

    expect(screen.getByText('apple')).not.toBe(null);

    await user.click(screen.getByTestId('clear'));

    expect(screen.queryByText('apple')).toBe(null);
  });

  it('click clears selected value and focuses input', async () => {
    const { user } = await render(
      <Combobox.Root defaultValue="a">
        <Combobox.Input data-testid="input" />
        <Combobox.Clear data-testid="clear" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="a">a</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const input = screen.getByRole('combobox');
    await user.click(screen.getByTestId('clear'));

    expect(screen.queryByTestId('clear')).toBe(null);
    expect(document.activeElement).toBe(input);
  });

  it('clears after pointer interaction marks keyboard navigation inactive', async () => {
    const { user } = await render(
      <Combobox.Root defaultValue="a">
        <Combobox.Input data-testid="input" />
        <Combobox.Clear data-testid="clear" />
      </Combobox.Root>,
    );

    fireEvent.pointerMove(screen.getByTestId('input'));
    await user.click(screen.getByTestId('clear'));

    expect(screen.queryByTestId('clear')).toBe(null);
  });

  it('does not dismiss the popup on click (outsidePress is blocked)', async () => {
    const { user } = await render(
      <Combobox.Root defaultOpen defaultValue="a">
        <Combobox.Input data-testid="input" />
        <Combobox.Clear data-testid="clear" />
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

    expect(screen.getByRole('listbox')).not.toBe(null);

    await user.click(screen.getByTestId('clear'));

    expect(screen.getByRole('listbox')).not.toBe(null);
  });

  it('does not dismiss a popup input when the clear button is rendered outside it', async () => {
    const { user } = await render(
      <Combobox.Root items={['a', 'b']} defaultValue="a">
        <Combobox.Trigger>
          <Combobox.Value />
        </Combobox.Trigger>
        <Combobox.Clear data-testid="clear" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Input data-testid="input" />
              <Combobox.List>
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    await user.click(screen.getByRole('combobox'));
    await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus());

    await user.click(screen.getByTestId('clear'));

    expect(screen.getByRole('dialog')).not.toBe(null);
    expect(screen.getByTestId('input')).toHaveFocus();
    expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('aria-selected', 'false');
  });

  it('is disabled when root disabled and does nothing on click', async () => {
    await render(
      <Combobox.Root defaultValue="a" disabled>
        <Combobox.Input data-testid="input" />
        <Combobox.Clear data-testid="clear" />
      </Combobox.Root>,
    );

    const clear = screen.getByTestId('clear');
    expect(clear).toHaveAttribute('disabled');

    fireEvent.click(clear);
    expect(screen.getByTestId('clear')).not.toBe(null);
  });

  it('when root is readOnly it does nothing on click', async () => {
    await render(
      <Combobox.Root defaultValue="a" readOnly>
        <Combobox.Input data-testid="input" />
        <Combobox.Clear data-testid="clear" />
      </Combobox.Root>,
    );

    const clear = screen.getByTestId('clear');

    fireEvent.click(clear);
    expect(screen.getByTestId('clear')).not.toBe(null);
  });

  it('clears selection without closing and restores popup input focus', async () => {
    const { user } = await render(
      <Combobox.Root defaultValue="a">
        <Combobox.Trigger data-testid="trigger">
          <Combobox.Value placeholder="None" />
        </Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner data-testid="positioner">
            <Combobox.Popup>
              <Combobox.Input data-testid="input" />
              <Combobox.Clear
                keepMounted
                data-testid="clear"
                className={(state) => (state.visible ? 'visible' : 'hidden')}
              />
              <Combobox.List>
                <Combobox.Item value="a">a</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    await user.click(screen.getByTestId('trigger'));

    const clear = await screen.findByTestId('clear');

    await waitFor(() => {
      expect(screen.getByTestId('positioner')).toHaveAttribute('data-open', '');
    });
    expect(clear).toHaveClass('visible');
    expect(clear).toHaveAttribute('data-visible', '');

    await user.click(clear);

    await waitFor(() => {
      expect(clear).toHaveClass('hidden');
      expect(clear).not.toHaveAttribute('data-visible');
    });
    expect(screen.getByRole('dialog')).not.toBe(null);
    expect(screen.getByTestId('input')).toHaveFocus();
    expect(screen.getByTestId('trigger')).toHaveTextContent('None');
    expect(screen.getByRole('option', { name: 'a' })).toHaveAttribute('aria-selected', 'false');
  });

  describe.skipIf(isJSDOM)('animations', () => {
    it('triggers enter animation via data-starting-style when becoming visible', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      let animationFinished = false;
      const notifyAnimationFinished = () => {
        animationFinished = true;
      };

      const style = `
        .animation-test-indicator {
          transition: opacity 1ms;
        }

        .animation-test-indicator[data-starting-style],
        .animation-test-indicator[data-ending-style] {
          opacity: 0;
        }
      `;

      const { user } = await render(
        <div>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <Combobox.Root>
            <Combobox.Input data-testid="input" />
            <Combobox.Clear
              className="animation-test-indicator"
              data-testid="clear"
              onTransitionEnd={notifyAnimationFinished}
            />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup>
                  <Combobox.List>
                    <Combobox.Item value="a">a</Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </div>,
      );

      expect(screen.queryByTestId('clear')).toBe(null);

      const input = screen.getByTestId('input');
      await user.click(input);
      await waitFor(() => expect(screen.getByRole('listbox')).not.toBe(null));
      await user.click(screen.getByRole('option', { name: 'a' }));

      await waitFor(() => {
        expect(animationFinished).toBe(true);
      });
      expect(screen.getByTestId('clear')).not.toBe(null);
    });

    it('triggers exit animation via data-ending-style before unmount', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      let animationFinished = false;
      const notifyAnimationFinished = () => {
        animationFinished = true;
      };

      const style = `
        .animation-test-indicator {
          transition: opacity 1ms;
        }

        .animation-test-indicator[data-starting-style],
        .animation-test-indicator[data-ending-style] {
          opacity: 0;
        }
      `;

      const { user } = await render(
        <div>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <Combobox.Root defaultValue="a">
            <Combobox.Input data-testid="input" />
            <Combobox.Clear
              className="animation-test-indicator"
              data-testid="clear"
              keepMounted
              onTransitionEnd={notifyAnimationFinished}
            />
          </Combobox.Root>
        </div>,
      );

      const clear = screen.getByTestId('clear');
      expect(clear).not.toBe(null);

      await user.click(clear);

      await waitFor(() => {
        expect(animationFinished).toBe(true);
      });
    });
  });
});
