import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { createRenderer, isJSDOM, popupConformanceTests } from '#test-utils';
import { OPEN_DELAY } from '../utils/constants';

describe('<Popover.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render, clock } = createRenderer();

  popupConformanceTests({
    createComponent: (props) => (
      <Popover.Root {...props.root}>
        <Popover.Trigger {...props.trigger}>Open menu</Popover.Trigger>
        <Popover.Portal {...props.portal}>
          <Popover.Positioner>
            <Popover.Popup {...props.popup}>Content</Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    ),
    render,
    triggerMouseAction: 'click',
    expectedPopupRole: 'dialog',
  });

  it('should render the children', async () => {
    await render(
      <Popover.Root>
        <Popover.Trigger>Content</Popover.Trigger>
      </Popover.Root>,
    );

    expect(screen.getByText('Content')).not.to.equal(null);
  });

  describe('uncontrolled open', () => {
    it('should close when the anchor is clicked twice', async () => {
      await render(
        <Popover.Root>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.click(anchor);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.click(anchor);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('controlled open', () => {
    it('should call onChange when the open state changes', async () => {
      const handleChange = spy();

      function App() {
        const [open, setOpen] = React.useState(false);

        return (
          <Popover.Root
            open={open}
            onOpenChange={(trigger) => {
              handleChange(open);
              setOpen(trigger !== null);
            }}
          >
            <Popover.Trigger />
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        );
      }

      await render(<App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const anchor = screen.getByRole('button');

      fireEvent.click(anchor);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.click(anchor);

      expect(screen.queryByText('Content')).to.equal(null);
      expect(handleChange.callCount).to.equal(2);
      expect(handleChange.firstCall.args[0]).to.equal(false);
      expect(handleChange.secondCall.args[0]).to.equal(true);
    });

    it('should not call onChange when the open state does not change', async () => {
      const handleChange = spy();

      function App() {
        const [open, setOpen] = React.useState(false);

        return (
          <Popover.Root
            open={open}
            onOpenChange={(trigger) => {
              handleChange(open);
              setOpen(trigger !== null);
            }}
          >
            <Popover.Trigger />
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        );
      }

      await render(<App />);

      expect(screen.queryByText('Content')).to.equal(null);

      const anchor = screen.getByRole('button');

      fireEvent.click(anchor);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
      expect(handleChange.callCount).to.equal(1);
      expect(handleChange.firstCall.args[0]).to.equal(false);
    });
  });

  describe('prop: defaultOpen', () => {
    it('should open when the component is rendered', async () => {
      await render(
        <Popover.Root defaultOpen>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should not open when the component is rendered and open is controlled', async () => {
      await render(
        <Popover.Root defaultOpen open={false}>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should not close when the component is rendered and open is controlled', async () => {
      await render(
        <Popover.Root defaultOpen open>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);
    });

    it('should remain uncontrolled', async () => {
      await render(
        <Popover.Root defaultOpen>
          <Popover.Trigger data-testid="trigger" />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(screen.getByText('Content')).not.to.equal(null);

      const anchor = screen.getByTestId('trigger');

      fireEvent.click(anchor);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('prop: delay', () => {
    clock.withFakeTimers();

    it('should open after delay with rest type by default', async () => {
      await render(
        <Popover.Root>
          <Popover.Trigger openOnHover delay={100} />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.mouseEnter(anchor);
      fireEvent.mouseMove(anchor);

      await flushMicrotasks();

      expect(screen.queryByText('Content')).to.equal(null);

      clock.tick(100);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);
    });
  });

  describe('prop: closeDelay', () => {
    clock.withFakeTimers();

    it('should close after delay', async () => {
      await render(
        <Popover.Root>
          <Popover.Trigger openOnHover closeDelay={100} />
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const anchor = screen.getByRole('button');

      fireEvent.mouseEnter(anchor);
      fireEvent.mouseMove(anchor);

      clock.tick(OPEN_DELAY);

      await flushMicrotasks();

      expect(screen.getByText('Content')).not.to.equal(null);

      fireEvent.mouseLeave(anchor);

      clock.tick(50);

      expect(screen.getByText('Content')).not.to.equal(null);

      clock.tick(50);

      expect(screen.queryByText('Content')).to.equal(null);
    });
  });

  describe('focus management', () => {
    it('focuses the trigger after the popover is closed but not unmounted', async () => {
      const { user } = await render(
        <div>
          <input type="text" />
          <Popover.Root>
            <Popover.Trigger>Toggle</Popover.Trigger>
            <Popover.Portal keepMounted>
              <Popover.Positioner>
                <Popover.Popup>
                  <Popover.Close>Close</Popover.Close>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <input type="text" />
        </div>,
      );

      const toggle = screen.getByRole('button', { name: 'Toggle' });

      await user.click(toggle);
      await flushMicrotasks();

      const close = screen.getByRole('button', { name: 'Close' });

      await user.click(close);

      await waitFor(
        () => {
          expect(toggle).toHaveFocus();
        },
        { timeout: 1500 },
      );
    });

    it('does not move focus to the popover when opened with hover', async () => {
      const { user } = await render(
        <Popover.Root>
          <Popover.Trigger openOnHover delay={0}>
            Toggle
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Close>Close</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const toggle = screen.getByRole('button', { name: 'Toggle' });

      act(() => toggle.focus());

      await user.hover(toggle);
      await flushMicrotasks();

      const close = screen.getByRole('button', { name: 'Close' });

      expect(close).not.to.equal(null);
      expect(close).not.to.toHaveFocus();
    });

    it('does not change focus when opened with hover and closed', async () => {
      const style = `
        .popup {
          width: 100px;
          height: 100px;
          background-color: red;
          opacity: 1;
          transition: opacity 1ms;
        }

        .popup[data-exiting] {
          opacity: 0;
        }
      `;

      const { user } = await render(
        <div>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <input type="text" data-testid="first-input" />
          <Popover.Root>
            <Popover.Trigger openOnHover delay={0} closeDelay={0}>
              Toggle
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup className="popup" />
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <input type="text" data-testid="last-input" />
        </div>,
      );

      const toggle = screen.getByRole('button', { name: 'Toggle' });
      const firstInput = screen.getByTestId('first-input');
      const lastInput = screen.getByTestId('last-input');

      await act(async () => lastInput.focus());

      await user.hover(toggle);
      await flushMicrotasks();

      await user.hover(firstInput);
      await flushMicrotasks();

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });

      expect(lastInput).toHaveFocus();
    });
  });

  describe('outside press event with backdrops', () => {
    it('uses intentional outside press with user backdrop (mouse): closes on click, not on mousedown', async () => {
      const handleOpenChange = spy();

      const { queryByRole } = await render(
        <Popover.Root defaultOpen onOpenChange={handleOpenChange}>
          <Popover.Trigger />
          <Popover.Portal>
            <Popover.Backdrop data-testid="backdrop" />
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const backdrop = screen.getByTestId('backdrop');

      fireEvent.mouseDown(backdrop);
      expect(queryByRole('dialog')).not.to.equal(null);
      expect(handleOpenChange.callCount).to.equal(0);

      fireEvent.click(backdrop);
      await waitFor(() => {
        expect(queryByRole('dialog')).to.equal(null);
      });
      expect(handleOpenChange.callCount).to.equal(1);
    });

    it('uses intentional outside press with internal backdrop (modal=true): closes on click, not on mousedown', async () => {
      const handleOpenChange = spy();

      const { queryByRole } = await render(
        <Popover.Root defaultOpen onOpenChange={handleOpenChange} modal>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const internalBackdrop = document.querySelector('[role="presentation"]') as HTMLElement;

      fireEvent.mouseDown(internalBackdrop);
      expect(queryByRole('dialog')).not.to.equal(null);
      expect(handleOpenChange.callCount).to.equal(0);

      fireEvent.click(internalBackdrop);
      await waitFor(() => {
        expect(queryByRole('dialog')).to.equal(null);
      });
      expect(handleOpenChange.callCount).to.equal(1);
    });
  });

  describe.skipIf(isJSDOM)('pointerdown removal', () => {
    it('moves focus to the popup when a focused child is removed on pointerdown and outside press still dismisses', async () => {
      function Test() {
        const [showButton, setShowButton] = React.useState(true);
        return (
          <Popover.Root defaultOpen modal="trap-focus">
            <Popover.Trigger>Toggle</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup data-testid="popup">
                  {showButton && (
                    <button data-testid="remove" onPointerDown={() => setShowButton(false)}>
                      Remove on pointer down
                    </button>
                  )}
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        );
      }

      const { user } = await render(<Test />);

      const removeButton = screen.getByTestId('remove');
      fireEvent.pointerDown(removeButton);

      const popup = screen.getByTestId('popup');
      await waitFor(() => {
        expect(popup).toHaveFocus();
      });

      await user.click(document.body);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });
    });
  });

  describe('prop: actionsRef', () => {
    it('unmounts the popover when the `unmount` method is called', async () => {
      const actionsRef = {
        current: {
          unmount: spy(),
        },
      };

      const { user } = await render(
        <Popover.Root actionsRef={actionsRef}>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>Content</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      await act(async () => actionsRef.current.unmount());

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).to.equal(null);
      });
    });
  });

  describe('prop: modal', () => {
    it('should render an internal backdrop when `true`', async () => {
      const { user } = await render(
        <div>
          <Popover.Root modal>
            <Popover.Trigger>Open</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner data-testid="positioner">
                <Popover.Popup>Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <button>Outside</button>
        </div>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      const positioner = screen.getByTestId('positioner');

      expect(positioner.previousElementSibling).to.have.attribute('role', 'presentation');
    });

    it('should not render an internal backdrop when `false`', async () => {
      const { user } = await render(
        <div>
          <Popover.Root modal={false}>
            <Popover.Trigger>Open</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner data-testid="positioner">
                <Popover.Popup>Content</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <button>Outside</button>
        </div>,
      );

      const trigger = screen.getByRole('button', { name: 'Open' });

      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.to.equal(null);
      });

      const positioner = screen.getByTestId('positioner');

      expect(positioner.previousElementSibling).to.equal(null);
    });
  });

  describe.skipIf(isJSDOM)('prop: onOpenChangeComplete', () => {
    it('is called on close when there is no exit animation defined', async () => {
      const onOpenChangeComplete = spy();

      function Test() {
        const [open, setOpen] = React.useState(true);
        return (
          <div>
            <button onClick={() => setOpen(false)}>Close</button>
            <Popover.Root open={open} onOpenChangeComplete={onOpenChangeComplete}>
              <Popover.Trigger>Trigger</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup" />
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('popup')).to.equal(null);
      });

      expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
      expect(onOpenChangeComplete.lastCall.args[0]).to.equal(false);
    });

    it('is called on close when the exit animation finishes', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const onOpenChangeComplete = spy();

      function Test() {
        const style = `
          @keyframes test-anim {
            to {
              opacity: 0;
            }
          }

          .animation-test-indicator[data-ending-style] {
            animation: test-anim 1ms;
          }
        `;

        const [open, setOpen] = React.useState(true);

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={() => setOpen(false)}>Close</button>
            <Popover.Root open={open} onOpenChangeComplete={onOpenChangeComplete}>
              <Popover.Trigger>Trigger</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup className="animation-test-indicator" data-testid="popup" />
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      expect(screen.getByTestId('popup')).not.to.equal(null);

      // Wait for open animation to finish
      await waitFor(() => {
        expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
      });

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('popup')).to.equal(null);
      });

      expect(onOpenChangeComplete.lastCall.args[0]).to.equal(false);
    });

    it('is called on open when there is no enter animation defined', async () => {
      const onOpenChangeComplete = spy();

      function Test() {
        const [open, setOpen] = React.useState(false);
        return (
          <div>
            <button onClick={() => setOpen(true)}>Open</button>
            <Popover.Root open={open} onOpenChangeComplete={onOpenChangeComplete}>
              <Popover.Trigger>Trigger</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup data-testid="popup" />
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const openButton = screen.getByText('Open');
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.queryByTestId('popup')).not.to.equal(null);
      });

      expect(onOpenChangeComplete.callCount).to.equal(2);
      expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
    });

    it('is called on open when the enter animation finishes', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const onOpenChangeComplete = spy();

      function Test() {
        const style = `
          @keyframes test-anim {
            from {
              opacity: 0;
            }
          }

          .animation-test-indicator[data-starting-style] {
            animation: test-anim 1ms;
          }
        `;

        const [open, setOpen] = React.useState(false);

        return (
          <div>
            {/* eslint-disable-next-line react/no-danger */}
            <style dangerouslySetInnerHTML={{ __html: style }} />
            <button onClick={() => setOpen(true)}>Open</button>
            <Popover.Root
              open={open}
              onOpenChange={(trigger) => setOpen(trigger !== null)}
              onOpenChangeComplete={onOpenChangeComplete}
            >
              <Popover.Trigger>Trigger</Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup className="animation-test-indicator" data-testid="popup" />
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const openButton = screen.getByText('Open');
      await user.click(openButton);

      // Wait for open animation to finish
      await waitFor(() => {
        expect(onOpenChangeComplete.firstCall.args[0]).to.equal(true);
      });

      expect(screen.queryByTestId('popup')).not.to.equal(null);
    });

    it('does not get called on mount when not open', async () => {
      const onOpenChangeComplete = spy();

      await render(
        <Popover.Root onOpenChangeComplete={onOpenChangeComplete}>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup />
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(onOpenChangeComplete.callCount).to.equal(0);
    });
  });

  it('should close child popover when clicking parent popover', async () => {
    const { user } = await render(
      <Popover.Root>
        <Popover.Trigger data-testid="parent-trigger">parent</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup data-testid="parent-popup">
              <Popover.Root>
                <Popover.Trigger data-testid="child-trigger">child</Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner>
                    <Popover.Popup data-testid="child-popup" />
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );

    expect(screen.queryByTestId('parent-popup')).to.equal(null);
    expect(screen.queryByTestId('child-popup')).to.equal(null);

    const parentTrigger = screen.getByTestId('parent-trigger');
    await user.click(parentTrigger);
    await flushMicrotasks();

    const parentPopup = screen.getByTestId('parent-popup');

    expect(parentPopup).not.to.equal(null);
    expect(screen.queryByTestId('child-popup')).to.equal(null);

    const childTrigger = screen.getByTestId('child-trigger');
    await user.click(childTrigger);
    await flushMicrotasks();

    expect(parentPopup).not.to.equal(null);
    expect(screen.getByTestId('child-popup')).not.to.equal(null);

    await user.click(parentPopup);
    await flushMicrotasks();

    expect(screen.queryByTestId('parent-popup')).not.to.equal(null);
    expect(screen.queryByTestId('child-popup')).to.equal(null);
  });

  describe('multiple triggers within Root', () => {
    it('should open the popover with any trigger', async () => {
      const { user } = await render(
        <Popover.Root>
          <Popover.Trigger>Trigger 1</Popover.Trigger>
          <Popover.Trigger>Trigger 2</Popover.Trigger>
          <Popover.Trigger>Trigger 3</Popover.Trigger>

          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                Popover Content
                <Popover.Close>Close</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      expect(screen.queryByText('Popover Content')).to.equal(null);

      await user.click(trigger1);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).to.equal(null);

      await user.click(trigger2);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).to.equal(null);

      await user.click(trigger3);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).to.equal(null);
    });

    it('should open the popover with any trigger', async () => {
      const { user } = await render(
        <Popover.Root>
          <Popover.Trigger>Trigger 1</Popover.Trigger>
          <Popover.Trigger>Trigger 2</Popover.Trigger>
          <Popover.Trigger>Trigger 3</Popover.Trigger>

          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                Popover Content
                <Popover.Close>Close</Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      expect(screen.queryByText('Popover Content')).to.equal(null);

      await user.click(trigger1);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).to.equal(null);

      await user.click(trigger2);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).to.equal(null);

      await user.click(trigger3);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).to.equal(null);
    });

    it('should set the payload and render content based on its value', async () => {
      const { user } = await render(
        <Popover.Root>
          {({ payload }) => (
            <React.Fragment>
              <Popover.Trigger payload={1}>Trigger 1</Popover.Trigger>
              <Popover.Trigger payload={2}>Trigger 2</Popover.Trigger>

              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>
                    <span data-testid="content">{payload as number}</span>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </React.Fragment>
          )}
        </Popover.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      expect(screen.getByTestId('content').textContent).to.equal('1');

      await user.click(trigger2);
      expect(screen.getByTestId('content').textContent).to.equal('2');
    });

    it('should reuse the popup and positioner DOM nodes when switching triggers', async () => {
      const { user } = await render(
        <Popover.Root>
          {({ payload }) => (
            <React.Fragment>
              <Popover.Trigger payload={1}>Trigger 1</Popover.Trigger>
              <Popover.Trigger payload={2}>Trigger 2</Popover.Trigger>

              <Popover.Portal>
                <Popover.Positioner data-testid="positioner">
                  <Popover.Popup data-testid="popup">
                    <span>{payload as number}</span>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </React.Fragment>
          )}
        </Popover.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      const popupElement = screen.getByTestId('popup');
      const positionerElement = screen.getByTestId('positioner');

      await user.click(trigger2);
      expect(screen.getByTestId('popup')).to.equal(popupElement);
      expect(screen.getByTestId('positioner')).to.equal(positionerElement);
    });

    it('should allow controlling the popover state programmatically', async () => {
      function Test() {
        const [trigger1, setTrigger1] = React.useState<HTMLElement | null>(null);
        const [trigger2, setTrigger2] = React.useState<HTMLElement | null>(null);
        const [activeTrigger, setActiveTrigger] = React.useState<HTMLElement | null>(null);

        return (
          <div>
            <Popover.Root
              open={activeTrigger}
              onOpenChange={(nextOpen, event, reason, trigger) => setActiveTrigger(trigger)}
            >
              {({ payload }) => (
                <React.Fragment>
                  <Popover.Trigger payload={1} ref={setTrigger1}>
                    Trigger 1
                  </Popover.Trigger>
                  <Popover.Trigger payload={2} ref={setTrigger2}>
                    Trigger 2
                  </Popover.Trigger>

                  <Popover.Portal>
                    <Popover.Positioner>
                      <Popover.Popup>
                        <span data-testid="content">{payload as number}</span>
                      </Popover.Popup>
                    </Popover.Positioner>
                  </Popover.Portal>
                </React.Fragment>
              )}
            </Popover.Root>
            <button onClick={() => setActiveTrigger(trigger1)}>Open Trigger 1</button>
            <button onClick={() => setActiveTrigger(trigger2)}>Open Trigger 2</button>
            <button onClick={() => setActiveTrigger(null)}>Close</button>
          </div>
        );
      }

      const { user } = await render(<Test />);
      await user.click(screen.getByRole('button', { name: 'Open Trigger 1' }));
      expect(screen.getByTestId('content').textContent).to.equal('1');
      await user.click(screen.getByRole('button', { name: 'Open Trigger 2' }));
      expect(screen.getByTestId('content').textContent).to.equal('2');
      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByTestId('content')).to.equal(null);
    });
  });

  describe('multiple detached triggers', () => {
    it('should open the popover with any trigger', async () => {
      const testPopover = Popover.createHandle();
      const { user } = await render(
        <div>
          <Popover.Trigger handle={testPopover}>Trigger 1</Popover.Trigger>
          <Popover.Trigger handle={testPopover}>Trigger 2</Popover.Trigger>
          <Popover.Trigger handle={testPopover}>Trigger 3</Popover.Trigger>

          <Popover.Root handle={testPopover}>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Popup>
                  Popover Content
                  <Popover.Close>Close</Popover.Close>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      expect(screen.queryByText('Popover Content')).to.equal(null);

      await user.click(trigger1);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).to.equal(null);

      await user.click(trigger2);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).to.equal(null);

      await user.click(trigger3);
      expect(screen.getByText('Popover Content')).toBeVisible();
      await user.click(screen.getByText('Close'));
      expect(screen.queryByText('Popover Content')).to.equal(null);
    });

    it('should set the payload and render content based on its value', async () => {
      const testPopover = Popover.createHandle<number>();
      const { user } = await render(
        <div>
          <Popover.Trigger handle={testPopover} payload={1}>
            Trigger 1
          </Popover.Trigger>
          <Popover.Trigger handle={testPopover} payload={2}>
            Trigger 2
          </Popover.Trigger>

          <Popover.Root handle={testPopover}>
            {({ payload }) => (
              <Popover.Portal>
                <Popover.Positioner>
                  <Popover.Popup>
                    <span data-testid="content">{payload as number}</span>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            )}
          </Popover.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      expect(screen.getByTestId('content').textContent).to.equal('1');

      await user.click(trigger2);
      expect(screen.getByTestId('content').textContent).to.equal('2');
    });

    it('should reuse the popup and positioner DOM nodes when switching triggers', async () => {
      const testPopover = Popover.createHandle<number>();
      const { user } = await render(
        <React.Fragment>
          <Popover.Trigger handle={testPopover} payload={1}>
            Trigger 1
          </Popover.Trigger>
          <Popover.Trigger handle={testPopover} payload={2}>
            Trigger 2
          </Popover.Trigger>

          <Popover.Root handle={testPopover}>
            {({ payload }) => (
              <Popover.Portal>
                <Popover.Positioner data-testid="positioner">
                  <Popover.Popup data-testid="popup">
                    <span>{payload as number}</span>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            )}
          </Popover.Root>
        </React.Fragment>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(trigger1);
      const popupElement = screen.getByTestId('popup');
      const positionerElement = screen.getByTestId('positioner');

      await user.click(trigger2);
      expect(screen.getByTestId('popup')).to.equal(popupElement);
      expect(screen.getByTestId('positioner')).to.equal(positionerElement);
    });

    it('should allow controlling the popover state programmatically', async () => {
      const testPopover = Popover.createHandle<number>();
      function Test() {
        const [trigger1, setTrigger1] = React.useState<HTMLElement | null>(null);
        const [trigger2, setTrigger2] = React.useState<HTMLElement | null>(null);
        const [activeTrigger, setActiveTrigger] = React.useState<HTMLElement | null>(null);

        return (
          <div style={{ margin: 50 }}>
            <Popover.Trigger handle={testPopover} payload={1} ref={setTrigger1}>
              Trigger 1
            </Popover.Trigger>
            <Popover.Trigger handle={testPopover} payload={2} ref={setTrigger2}>
              Trigger 2
            </Popover.Trigger>

            <Popover.Root
              open={activeTrigger}
              onOpenChange={(nextOpen, event, reason, trigger) => setActiveTrigger(trigger)}
              handle={testPopover}
            >
              {({ payload }) => (
                <Popover.Portal>
                  <Popover.Positioner data-testid="positioner" side="bottom" align="start">
                    <Popover.Popup>
                      <span data-testid="content">{payload}</span>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              )}
            </Popover.Root>

            <button onClick={() => setActiveTrigger(trigger1)}>Open Trigger 1</button>
            <button onClick={() => setActiveTrigger(trigger2)}>Open Trigger 2</button>
            <button onClick={() => setActiveTrigger(null)}>Close</button>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(screen.getByRole('button', { name: 'Open Trigger 1' }));
      expect(screen.getByTestId('content').textContent).to.equal('1');

      await waitFor(() => {
        expect(screen.getByTestId('positioner').getBoundingClientRect().left).to.equal(
          trigger1.getBoundingClientRect().left,
        );
      });

      await user.click(screen.getByRole('button', { name: 'Open Trigger 2' }));
      expect(screen.getByTestId('content').textContent).to.equal('2');
      await waitFor(() => {
        expect(screen.getByTestId('positioner').getBoundingClientRect().left).to.equal(
          trigger2.getBoundingClientRect().left,
        );
      });

      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByTestId('content')).to.equal(null);
    });
  });
});
