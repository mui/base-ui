import { expect, vi } from 'vitest';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance } from '#test-utils';
import { act, screen } from '@mui/internal-test-utils';

describe('<Combobox.List />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.List />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Combobox.Root>{node}</Combobox.Root>);
    },
  }));

  it('sets role=listbox and aria-multiselectable in multiple mode', async () => {
    await render(
      <Combobox.Root multiple defaultOpen>
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

    const list = screen.getByRole('listbox');
    expect(list).toHaveAttribute('aria-multiselectable', 'true');
  });

  it('does not prevent Enter when no item is highlighted', async () => {
    await render(
      <Combobox.Root defaultOpen>
        <Combobox.Input />
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

    const list = screen.getByRole('listbox');
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    await act(async () => list.dispatchEvent(event));
    expect(event.defaultPrevented).toBe(false);
  });

  it('selects the highlighted item with Enter', async () => {
    const onValueChange = vi.fn();
    const { user } = await render(
      <Combobox.Root defaultOpen onValueChange={onValueChange}>
        <Combobox.Input />
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

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}');

    const list = screen.getByRole('listbox');
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    await act(async () => list.dispatchEvent(event));

    expect(onValueChange).toHaveBeenCalledWith('a', expect.anything());
  });

  it.each([{ disabled: true }, { readOnly: true }])(
    'ignores Enter when interaction is disabled: %o',
    async (rootProps) => {
      const onValueChange = vi.fn();
      await render(
        <Combobox.Root defaultOpen onValueChange={onValueChange} {...rootProps}>
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

      const list = screen.getByRole('listbox');
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      await act(async () => list.dispatchEvent(event));

      expect(onValueChange).not.toHaveBeenCalled();
    },
  );
});
