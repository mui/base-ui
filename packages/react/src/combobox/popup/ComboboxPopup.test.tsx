import { expect, describe, it, vi } from 'vitest';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';

describe('<Combobox.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Combobox.Root open>
          <Combobox.Portal>
            <Combobox.Positioner>{node}</Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );
    },
  }));

  it('exposes open state via data attributes mapping', async () => {
    await render(
      <Combobox.Root defaultOpen>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup data-testid="popup" />
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const popup = await screen.findByTestId('popup');
    expect(popup).toHaveAttribute('data-open');
  });

  it('sets role to presentation when input renders outside the popup', async () => {
    await render(
      <Combobox.Root defaultOpen items={['Apple']}>
        <Combobox.Input />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup data-testid="popup" />
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const popup = await screen.findByTestId('popup');
    await waitFor(() => {
      expect(popup).toHaveAttribute('role', 'presentation');
    });
  });

  it('sets role to dialog when input renders inside the popup', async () => {
    await render(
      <Combobox.Root defaultOpen items={['Apple']}>
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup data-testid="popup">
              <Combobox.Input />
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const popup = await screen.findByTestId('popup');
    await waitFor(() => {
      expect(popup).toHaveAttribute('role', 'dialog');
    });
  });

  it('focuses the popup instead of its input when opened by touch', async () => {
    await render(
      <Combobox.Root>
        <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup data-testid="popup">
              <Combobox.Input data-testid="input" />
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const trigger = screen.getByTestId('trigger');
    fireEvent.pointerDown(trigger, { pointerType: 'touch' });
    fireEvent.mouseDown(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('popup')).toHaveFocus();
    });
    expect(screen.getByTestId('input')).not.toHaveFocus();
  });

  it('honors initialFocus={false}', async () => {
    await render(
      <Combobox.Root>
        <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup initialFocus={false}>
              <Combobox.Input data-testid="input" />
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );

    const trigger = screen.getByTestId('trigger');
    trigger.focus();
    fireEvent.click(trigger);

    await screen.findByTestId('input');
    expect(trigger).toHaveFocus();
  });

  it('passes the close type of an item press to a finalFocus function', async () => {
    const finalFocus = vi.fn(() => false);

    const { user } = await render(
      <Combobox.Root>
        <Combobox.Input data-testid="input" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup finalFocus={finalFocus}>
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
    // user-event's synthetic clicks carry no pointer type, so the mouse press is dispatched
    // directly.
    const option = await screen.findByRole('option', { name: 'a' });
    fireEvent.pointerDown(option, { pointerType: 'mouse' });
    fireEvent.click(option, { detail: 1 });
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBe(null);
    });
    expect(finalFocus).toHaveBeenLastCalledWith('mouse');

    await act(async () => {
      input.focus();
    });
    await user.keyboard('{ArrowDown}');
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBe(null);
    });
    expect(finalFocus).toHaveBeenLastCalledWith('keyboard');
  });

  it('returns focus to an explicitly provided element when the popup closes', async () => {
    function Test() {
      const finalFocusRef = React.useRef<HTMLButtonElement | null>(null);
      return (
        <div>
          <button ref={finalFocusRef} type="button">
            final focus
          </button>
          <Combobox.Root defaultOpen>
            <Combobox.Input />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup finalFocus={finalFocusRef}>
                  <Combobox.List>
                    <Combobox.Item value="a">a</Combobox.Item>
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </div>
      );
    }

    const { user } = await render(<Test />);
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'final focus' })).toHaveFocus();
    });
  });

  describe('data-instant', () => {
    // The popup unmounts as soon as it closes while animations are disabled, so the closing render
    // records what it saw.
    let closingInstants: Array<string | undefined> = [];
    function recordClosingInstant(state: Combobox.Popup.State) {
      if (!state.open) {
        closingInstants.push(state.instant);
      }
      return undefined;
    }

    function TestCombobox() {
      return (
        <Combobox.Root items={['Apple', 'Banana']}>
          <Combobox.Input data-testid="input" />
          <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner data-testid="positioner">
              <Combobox.Popup data-testid="popup" className={recordClosingInstant}>
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
        </Combobox.Root>
      );
    }

    it('is "dismiss" when Escape closes the popup', async () => {
      const { user } = await render(<TestCombobox />);

      await user.click(screen.getByTestId('input'));
      expect(screen.getByTestId('popup')).toHaveAttribute('data-open');
      expect(screen.getByTestId('popup')).not.toHaveAttribute('data-instant');

      closingInstants = [];
      await user.keyboard('{Escape}');

      expect(screen.queryByTestId('popup')).toBe(null);
      expect(closingInstants[0]).toBe('dismiss');
    });

    it.skipIf(isJSDOM)('stays "dismiss" on the popup while the exit animation runs', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const style = `
          @keyframes combobox-instant-exit {
            to {
              opacity: 0;
            }
          }

          .combobox-instant-exit[data-ending-style] {
            animation: combobox-instant-exit 10s linear;
          }
        `;

      const { user } = await render(
        <React.Fragment>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <Combobox.Root items={['Apple']} defaultOpen>
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup data-testid="popup" className="combobox-instant-exit">
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
          </Combobox.Root>
        </React.Fragment>,
      );

      const popup = screen.getByTestId('popup');
      expect(popup).not.toHaveAttribute('data-instant');

      await act(async () => {
        screen.getByTestId('input').focus();
      });
      await user.keyboard('{Escape}');

      // The exit animation is long, so the popup is still mounted and animating out.
      await waitFor(() => {
        expect(popup).toHaveAttribute('data-ending-style');
      });
      expect(popup).toHaveAttribute('data-instant', 'dismiss');
    });

    it('is "click" on the popup and the positioner when a keyboard press on the trigger opens the popup', async () => {
      const { user } = await render(<TestCombobox />);

      await act(async () => {
        screen.getByTestId('trigger').focus();
      });
      await user.keyboard('{Enter}');

      expect(screen.getByTestId('popup')).toHaveAttribute('data-open');
      expect(screen.getByTestId('popup')).toHaveAttribute('data-instant', 'click');
      expect(screen.getByTestId('positioner')).toHaveAttribute('data-instant', 'click');
    });

    it('is "click" when Enter selects the highlighted item', async () => {
      const { user } = await render(<TestCombobox />);

      await user.click(screen.getByTestId('input'));
      await user.keyboard('{ArrowDown}');
      expect(screen.getByTestId('popup')).not.toHaveAttribute('data-instant');

      closingInstants = [];
      await user.keyboard('{Enter}');

      expect(screen.getByTestId('input')).toHaveValue('Apple');
      expect(screen.queryByTestId('popup')).toBe(null);
      expect(closingInstants[0]).toBe('click');
    });

    it('is absent when a mouse press on an item closes the popup', async () => {
      const { user } = await render(<TestCombobox />);

      await user.click(screen.getByTestId('input'));
      expect(screen.getByTestId('popup')).toHaveAttribute('data-open');

      closingInstants = [];
      await user.click(screen.getByRole('option', { name: 'Apple' }));

      expect(screen.getByTestId('input')).toHaveValue('Apple');
      expect(screen.queryByTestId('popup')).toBe(null);
      expect(closingInstants).not.toHaveLength(0);
      expect(closingInstants[0]).toBe(undefined);
    });

    it('is removed when a controlled `open` reopens the popup after a dismissal', async () => {
      function ControlledCombobox() {
        const [open, setOpen] = React.useState(false);
        return (
          <React.Fragment>
            <button onClick={() => setOpen(true)}>Open externally</button>
            <Combobox.Root items={['Apple']} open={open} onOpenChange={setOpen}>
              <Combobox.Input data-testid="input" />
              <Combobox.Portal>
                <Combobox.Positioner>
                  <Combobox.Popup data-testid="popup">
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
            </Combobox.Root>
          </React.Fragment>
        );
      }
      const { user } = await render(<ControlledCombobox />);

      await user.click(screen.getByTestId('input'));
      await user.keyboard('{Escape}');
      expect(screen.queryByTestId('popup')).toBe(null);

      await user.click(screen.getByRole('button', { name: 'Open externally' }));

      expect(screen.getByTestId('popup')).toHaveAttribute('data-open');
      expect(screen.getByTestId('popup')).not.toHaveAttribute('data-instant');
    });

    // With animations disabled the popup unmounts in the commit that receives a closing prop, so
    // these run a long exit animation and read the attribute while the popup animates out.
    describe.skipIf(isJSDOM)('controlled `open` prop', () => {
      const style = `
        @keyframes combobox-controlled-exit {
          to {
            opacity: 0;
          }
        }

        .combobox-controlled-exit[data-ending-style] {
          animation: combobox-controlled-exit 10s linear;
        }
      `;

      function ControlledCombobox(props: { setOpenRef: React.Ref<(open: boolean) => void> }) {
        const [open, setOpen] = React.useState(false);
        React.useImperativeHandle(props.setOpenRef, () => setOpen, []);
        return (
          <React.Fragment>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <Combobox.Root items={['Apple']} open={open} onOpenChange={setOpen}>
              <Combobox.Input />
              <Combobox.Trigger data-testid="trigger">Open</Combobox.Trigger>
              <Combobox.Portal>
                <Combobox.Positioner>
                  <Combobox.Popup data-testid="popup" className="combobox-controlled-exit">
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
            </Combobox.Root>
          </React.Fragment>
        );
      }

      async function renderControlled() {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

        const setOpenRef = React.createRef<(open: boolean) => void>();
        const { user } = await render(<ControlledCombobox setOpenRef={setOpenRef} />);
        const setOpen = async (open: boolean) => {
          await act(async () => {
            setOpenRef.current?.(open);
          });
        };
        return { user, setOpen };
      }

      async function openWithKeyboard(user: Awaited<ReturnType<typeof render>>['user']) {
        await act(async () => {
          screen.getByTestId('trigger').focus();
        });
        await user.keyboard('{Enter}');
        await waitFor(() => {
          expect(screen.getByTestId('popup')).toHaveAttribute('data-open');
        });
      }

      it('stays "dismiss" when the parent accepts an Escape close', async () => {
        const { user } = await renderControlled();
        await openWithKeyboard(user);

        await user.keyboard('{Escape}');

        await waitFor(() => {
          expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
        });
        expect(screen.getByTestId('popup')).toHaveAttribute('data-instant', 'dismiss');
      });

      it('is removed when the prop closes a popup that a keyboard press opened', async () => {
        const { user, setOpen } = await renderControlled();
        await openWithKeyboard(user);
        expect(screen.getByTestId('popup')).toHaveAttribute('data-instant', 'click');

        await setOpen(false);

        await waitFor(() => {
          expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
        });
        expect(screen.getByTestId('popup')).not.toHaveAttribute('data-instant');
      });

      it('is removed when the prop reopens the popup during a dismissal', async () => {
        const { user, setOpen } = await renderControlled();
        await openWithKeyboard(user);
        await user.keyboard('{Escape}');
        await waitFor(() => {
          expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
        });

        await setOpen(true);

        await waitFor(() => {
          expect(screen.getByTestId('popup')).toHaveAttribute('data-open');
        });
        expect(screen.getByTestId('popup')).not.toHaveAttribute('data-instant');
      });
    });
  });
});
