import { expect } from 'vitest';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';

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

  // `inert` is only implemented in a real browser; jsdom keeps focus inside the closing popup.
  describe.skipIf(isJSDOM)('exit animation', () => {
    const style = `
      @keyframes combobox-close-test {
        to {
          opacity: 0;
        }
      }

      .animation-test-popup[data-ending-style] {
        animation: combobox-close-test 10s linear;
      }
    `;

    // The common layout keeps the input outside the popup. Focus usually remains on that input,
    // but custom controls in the popup can take focus and need an explicit close-time handoff.
    function AnimatedCombobox() {
      return (
        <React.Fragment>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <Combobox.Root items={['a', 'b']}>
            <Combobox.Input data-testid="input" />
            <Combobox.Portal>
              <Combobox.Positioner>
                <Combobox.Popup data-testid="popup" className="animation-test-popup">
                  <Combobox.List>
                    {(item: string) => (
                      <Combobox.Item key={item} value={item}>
                        {item}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                  <button type="button" data-testid="inside">
                    Create new
                  </button>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
          <button type="button" data-testid="after">
            After
          </button>
        </React.Fragment>
      );
    }

    it('returns focus to the input when the closing popup held it', async ({ onTestFinished }) => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      onTestFinished(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      const { user } = await render(<AnimatedCombobox />);
      await user.click(screen.getByTestId('input'));
      await user.click(await screen.findByTestId('inside'));
      expect(screen.getByTestId('inside')).toHaveFocus();

      await user.keyboard('{Escape}');
      expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');

      // Making the closing popup inert blurs whatever it held, so without a fallback focus would
      // sit on `<body>` for the whole exit animation, restarting the tab order at the top of the
      // document.
      await waitFor(() => expect(screen.getByTestId('input')).toHaveFocus());

      await user.keyboard('{Tab}');
      expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
      expect(screen.getByTestId('after')).toHaveFocus();
    });

    it('leaves focus alone when an outside press moved it out of the popup', async ({
      onTestFinished,
    }) => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      onTestFinished(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      const { user } = await render(
        <React.Fragment>
          <p data-testid="plain">Not focusable</p>
          <AnimatedCombobox />
        </React.Fragment>,
      );
      await user.click(screen.getByTestId('input'));
      await user.click(await screen.findByTestId('inside'));
      expect(screen.getByTestId('inside')).toHaveFocus();

      // Pressing non-focusable content blurs to `<body>`. That is the user's own gesture rather
      // than `inert` stranding focus, so the popup must not claw it back to the input.
      await user.click(screen.getByTestId('plain'));
      expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');

      expect(document.body).toHaveFocus();
    });

    it('starts each close with fresh return-focus state while the popup stays mounted', async ({
      onTestFinished,
    }) => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;
      onTestFinished(() => {
        globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
      });

      const { user } = await render(<AnimatedCombobox />);
      const input = screen.getByTestId('input');

      await user.click(input);
      await user.click(await screen.findByTestId('inside'));
      await user.keyboard('{Escape}');
      expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
      await waitFor(() => expect(input).toHaveFocus());

      await user.keyboard('{Tab}');
      expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
      expect(screen.getByTestId('after')).toHaveFocus();

      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
      expect(input).toHaveFocus();

      await user.keyboard('{ArrowDown}');
      await user.click(await screen.findByTestId('inside'));
      await user.keyboard('{Escape}');

      expect(screen.getByTestId('popup')).toHaveAttribute('data-ending-style');
      await waitFor(() => expect(input).toHaveFocus());
    });
  });
});
