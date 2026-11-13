import { describe, it, expect } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance } from '#test-utils';
import { screen, waitFor } from '@mui/internal-test-utils';

describe('<Combobox.ItemIndicator />', () => {
  const { render } = createRenderer();

  function TestComponent({ value, keepMounted }: { value: string; keepMounted?: boolean }) {
    return (
      <Combobox.Root value={value} open>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="a">
                  a
                  <Combobox.ItemIndicator keepMounted={keepMounted} data-testid="indicator" />
                </Combobox.Item>
                <Combobox.Item value="b">b</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    );
  }

  describeConformance(<Combobox.ItemIndicator keepMounted />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(
        <Combobox.Root>
          <Combobox.Item>{node}</Combobox.Item>
        </Combobox.Root>,
      );
    },
  }));

  it('removes the default checkmark when `children={null}` is passed alongside `render`', async () => {
    // See https://github.com/mui/base-ui/issues/4752 — `render` alone does not clear the
    // default glyph (that would change behavior for call sites using `render` only to swap
    // the tag); pairing it with `children={null}` is the documented way to opt out.
    await render(
      <Combobox.Root defaultOpen defaultValue="apple">
        <Combobox.Input />
        <Combobox.Portal keepMounted>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="apple">
                  apple
                  <Combobox.ItemIndicator
                    keepMounted
                    render={<span data-testid="custom-indicator" className="my-check" />}
                  >
                    {null}
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const indicator = screen.getByTestId('custom-indicator');
    expect(indicator.textContent).toBe('');
  });

  it('updates a mounted indicator when its item becomes unselected', async () => {
    const { user } = await render(
      <Combobox.Root defaultOpen defaultValue="apple">
        <Combobox.Input />
        <Combobox.Portal keepMounted>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.List>
                <Combobox.Item value="apple">
                  apple
                  <Combobox.ItemIndicator keepMounted data-testid="apple-indicator" />
                </Combobox.Item>
                <Combobox.Item value="banana">banana</Combobox.Item>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    expect(screen.getByTestId('apple-indicator')).toHaveAttribute('data-selected');

    await user.click(screen.getByRole('option', { name: 'banana' }));

    expect(screen.getByTestId('apple-indicator')).not.toHaveAttribute('data-selected');
  });

  it('mounts only while selected when keepMounted is false', async () => {
    const { setProps } = await render(<TestComponent value="b" />);

    expect(screen.queryByTestId('indicator')).toBe(null);

    await setProps({ value: 'a' });

    const indicator = screen.getByTestId('indicator');
    expect(indicator).toHaveAttribute('data-selected');
    expect(indicator).toHaveAttribute('aria-hidden', 'true');
    expect(indicator).not.toHaveAttribute('selected');

    await setProps({ value: 'b' });

    expect(screen.queryByTestId('indicator')).toBe(null);

    await setProps({ value: 'a' });

    expect(screen.getByTestId('indicator')).toHaveAttribute('data-selected');
  });

  it('preserves the kept-mounted element across selection changes', async () => {
    const { setProps } = await render(<TestComponent value="b" keepMounted />);
    const indicator = screen.getByTestId('indicator');

    expect(indicator).not.toHaveAttribute('data-selected');

    await setProps({ value: 'a' });

    expect(screen.getByTestId('indicator')).toBe(indicator);
    expect(indicator).toHaveAttribute('data-selected');

    await setProps({ value: 'b' });

    expect(screen.getByTestId('indicator')).toBe(indicator);
    expect(indicator).not.toHaveAttribute('data-selected');
    await waitFor(() => {
      expect(indicator).not.toHaveAttribute('data-ending-style');
    });

    await setProps({ value: 'a' });

    expect(screen.getByTestId('indicator')).toBe(indicator);
    expect(indicator).toHaveAttribute('data-selected');
  });
});
