import * as React from 'react';
import { expect } from 'chai';
import { Select } from '@base-ui/react/select';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Select.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Select.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Select.Root open>
          <Select.Portal>
            <Select.Positioner>{node}</Select.Positioner>
          </Select.Portal>
        </Select.Root>,
      );
    },
  }));

  it('has aria attributes when no Select.List is present', async () => {
    const { user } = await render(
      <Select.Root multiple>
        <Select.Trigger>Trigger</Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup data-testid="popup">Popup</Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    const trigger = screen.getByRole('combobox');

    expect(trigger).not.to.have.attribute('aria-controls');
    expect(trigger).to.have.attribute('aria-expanded', 'false');

    await user.click(trigger);

    const popup = await screen.findByTestId('popup');
    const listbox = await screen.findByRole('listbox');

    expect(popup).to.equal(listbox);
    expect(popup.id).not.to.equal('');
    expect(popup).to.have.attribute('aria-multiselectable', 'true');
    expect(trigger).to.have.attribute('aria-controls', popup.id);
    expect(trigger).to.have.attribute('aria-expanded', 'true');
    expect(trigger).to.have.attribute('aria-haspopup', 'listbox');
  });

  it('places aria attributes on Select.List instead if it is present', async () => {
    const { user } = await render(
      <Select.Root multiple>
        <Select.Trigger>Trigger</Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup data-testid="popup">
              <Select.List data-testid="list">
                <Select.Item value="1">Item 1</Select.Item>
                <Select.Item value="2">Item 2</Select.Item>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    const trigger = screen.getByRole('combobox');

    expect(trigger).not.to.have.attribute('aria-controls');
    expect(trigger).to.have.attribute('aria-expanded', 'false');
    expect(trigger).to.have.attribute('aria-haspopup', 'listbox');

    await user.click(trigger);

    const popup = await screen.findByTestId('popup');
    const list = await screen.findByTestId('list');
    const listbox = await screen.findByRole('listbox');

    expect(list).to.equal(listbox);
    expect(list).to.have.attribute('aria-multiselectable');
    expect(popup).to.have.attribute('role', 'presentation');
    expect(popup).not.to.have.attribute('aria-multiselectable');
    expect(list.id).not.to.equal('');
    expect(trigger).to.have.attribute('aria-controls', list.id);
    expect(trigger).not.to.have.attribute('aria-controls', popup.id);
    expect(trigger).to.have.attribute('aria-expanded', 'true');
    expect(trigger).to.have.attribute('aria-haspopup', 'listbox');
  });

  it('restores transform-related inline styles after measurement', async () => {
    let popupElement: HTMLElement | null = null;

    await render(
      <Select.Root open>
        <Select.Trigger>Trigger</Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup
              ref={(node) => {
                if (node) {
                  node.style.setProperty('transform', 'translateX(10px)');
                  node.style.setProperty('scale', '0.8');
                  node.style.setProperty('translate', '1px 2px');
                }
                popupElement = node;
              }}
            >
              <Select.Item value="1">
                <Select.ItemText>Item 1</Select.ItemText>
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    await new Promise<void>(queueMicrotask);

    expect(popupElement).not.to.equal(null);
    expect(popupElement!.style.getPropertyValue('transform')).to.equal('translateX(10px)');
    expect(popupElement!.style.getPropertyValue('scale')).to.equal('0.8');
    expect(popupElement!.style.getPropertyValue('translate')).to.equal('1px 2px');
  });

  describe('prop: finalFocus', () => {
    it('should focus the trigger by default when closed', async () => {
      await render(
        <div>
          <input />
          <Select.Root>
            <Select.Trigger data-testid="trigger">Open</Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Popup>
                  <Select.Item value="1">Item 1</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
          <input />
        </div>,
      );

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.click();
      });

      const item = screen.getByText('Item 1');
      await act(async () => {
        item.click();
      });

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it('should focus the element provided to the prop when closed', async () => {
      function TestComponent() {
        const inputRef = React.useRef<HTMLInputElement | null>(null);
        return (
          <div>
            <input />
            <Select.Root>
              <Select.Trigger data-testid="trigger">Open</Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup finalFocus={inputRef}>
                    <Select.Item value="1">Item 1</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            <input />
            <input data-testid="input-to-focus" ref={inputRef} />
            <input />
          </div>
        );
      }

      await render(<TestComponent />);

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.click();
      });

      const item = screen.getByText('Item 1');
      await act(async () => {
        item.click();
      });

      const inputToFocus = screen.getByTestId('input-to-focus');

      await waitFor(() => {
        expect(inputToFocus).toHaveFocus();
      });
    });

    it('should focus the element provided to `finalFocus` as a function when closed', async () => {
      function TestComponent() {
        const ref = React.useRef<HTMLInputElement>(null);
        const getRef = React.useCallback(() => ref.current, []);
        return (
          <div>
            <Select.Root>
              <Select.Trigger data-testid="trigger">Open</Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup finalFocus={getRef}>
                    <Select.Item value="1">Item 1</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            <input data-testid="input-to-focus" ref={ref} />
          </div>
        );
      }

      await render(<TestComponent />);

      const trigger = screen.getByTestId('trigger');
      await act(async () => {
        trigger.click();
      });

      const item = screen.getByText('Item 1');
      await act(async () => {
        item.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('input-to-focus')).toHaveFocus();
      });
    });

    it('should not move focus when finalFocus is false', async () => {
      function TestComponent() {
        return (
          <div>
            <Select.Root>
              <Select.Trigger data-testid="trigger">Open</Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup finalFocus={false}>
                    <Select.Item value="1">Item 1</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
        );
      }

      await render(<TestComponent />);
      const trigger = screen.getByTestId('trigger');

      await act(async () => {
        trigger.click();
      });

      const item = screen.getByText('Item 1');
      await act(async () => {
        item.click();
      });

      await waitFor(() => {
        expect(trigger).not.toHaveFocus();
      });
    });

    it('should move focus to trigger when finalFocus returns true', async () => {
      function TestComponent() {
        return (
          <div>
            <Select.Root>
              <Select.Trigger data-testid="trigger">Open</Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup finalFocus={() => true}>
                    <Select.Item value="1">Item 1</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
        );
      }

      await render(<TestComponent />);
      const trigger = screen.getByTestId('trigger');

      await act(async () => {
        trigger.click();
      });

      const item = screen.getByText('Item 1');
      await act(async () => {
        item.click();
      });

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it('uses default behavior when finalFocus returns null', async () => {
      function TestComponent() {
        return (
          <div>
            <Select.Root>
              <Select.Trigger data-testid="trigger">Open</Select.Trigger>
              <Select.Portal>
                <Select.Positioner>
                  <Select.Popup finalFocus={() => null}>
                    <Select.Item value="1">Item 1</Select.Item>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
        );
      }

      await render(<TestComponent />);
      const trigger = screen.getByTestId('trigger');

      await act(async () => {
        trigger.click();
      });

      const item = screen.getByText('Item 1');
      await act(async () => {
        item.click();
      });

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });
  });
});
