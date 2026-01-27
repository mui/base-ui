import * as React from 'react';
import { createRenderer, isJSDOM } from '#test-utils';
import { Tooltip } from '@base-ui/react/tooltip';
import { screen, waitFor, randomStringValue, act, flushMicrotasks } from '@mui/internal-test-utils';

describe('<Tooltip.Root />', () => {
  beforeEach(async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;

    await act(async () => {
      document.body.click();
    });

    // Wait for all tooltips to unmount
    await waitFor(() => {
      const tooltips = document.querySelectorAll('[data-open]');
      expect(tooltips.length).to.equal(0);
    });
  });

  const { render } = createRenderer();

  describe.skipIf(isJSDOM)('multiple triggers within Root', () => {
    type NumberPayload = { payload: number | undefined };

    it('should open the tooltip with any trigger on hover', async () => {
      vi.spyOn(console, 'error').mockImplementation((...args) => {
        if (args[0] === 'null') {
          // a bug in vitest prints specific browser errors as "null"
          // See https://github.com/vitest-dev/vitest/issues/9285
          // TODO(@mui/base): debug why this test triggers "ResizeObserver loop completed with undelivered notifications"
          // It seems related to @testing-library/user-event. Native vitest `userEvent` does not trigger it.
          return;
        }
        console.error(...args);
      });

      const popupId = randomStringValue();
      const { user } = await render(
        <Tooltip.Root>
          <input type="text" aria-label="Initial focus" autoFocus />
          <Tooltip.Trigger delay={0}>Trigger 1</Tooltip.Trigger>
          <Tooltip.Trigger delay={0}>Trigger 2</Tooltip.Trigger>
          <Tooltip.Trigger delay={0}>Trigger 3</Tooltip.Trigger>

          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup data-testid={popupId}>Tooltip Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).to.equal(null);
      });

      await user.hover(trigger1);
      expect(screen.queryByTestId(popupId)).toBeVisible();
      await user.hover(document.body);
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).to.equal(null);
      });

      await user.hover(trigger2);
      expect(screen.queryByTestId(popupId)).toBeVisible();
      await user.hover(document.body);
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).to.equal(null);
      });

      await user.hover(trigger3);
      expect(screen.queryByTestId(popupId)).toBeVisible();
      await user.hover(document.body);
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).to.equal(null);
      });
    });

    it('should open the tooltip with any trigger on focus', async () => {
      await render(
        <Tooltip.Root>
          <Tooltip.Trigger>Trigger 1</Tooltip.Trigger>
          <Tooltip.Trigger>Trigger 2</Tooltip.Trigger>
          <Tooltip.Trigger>Trigger 3</Tooltip.Trigger>

          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>Tooltip Content</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      expect(screen.queryByText('Tooltip Content')).to.equal(null);

      await act(async () => trigger1.focus());
      await flushMicrotasks();
      expect(screen.getByText('Tooltip Content')).toBeVisible();
      await act(async () => trigger1.blur());
      expect(screen.queryByText('Tooltip Content')).to.equal(null);

      await act(async () => trigger2.focus());
      await flushMicrotasks();
      expect(screen.getByText('Tooltip Content')).toBeVisible();
      await act(async () => trigger2.blur());
      expect(screen.queryByText('Tooltip Content')).to.equal(null);

      await act(async () => trigger3.focus());
      await flushMicrotasks();
      expect(screen.getByText('Tooltip Content')).toBeVisible();
      await act(async () => trigger3.blur());
      expect(screen.queryByText('Tooltip Content')).to.equal(null);
    });

    it('should set the payload and render content based on its value', async () => {
      const { user } = await render(
        <Tooltip.Root>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <Tooltip.Trigger payload={1} delay={0}>
                Trigger 1
              </Tooltip.Trigger>
              <Tooltip.Trigger payload={2} delay={0}>
                Trigger 2
              </Tooltip.Trigger>

              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>
                    <span data-testid="content">{payload}</span>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </React.Fragment>
          )}
        </Tooltip.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.hover(trigger1);
      expect(screen.getByTestId('content').textContent).to.equal('1');

      await user.unhover(trigger1);
      await user.hover(trigger2);
      expect(screen.getByTestId('content').textContent).to.equal('2');
    });

    it('should reuse the popup and positioner DOM nodes when switching triggers', async () => {
      await render(
        <Tooltip.Root>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <Tooltip.Trigger payload={1} delay={0}>
                Trigger 1
              </Tooltip.Trigger>
              <Tooltip.Trigger payload={2} delay={0}>
                Trigger 2
              </Tooltip.Trigger>

              <Tooltip.Portal>
                <Tooltip.Positioner data-testid="positioner" key="pos">
                  <Tooltip.Popup data-testid="popup" key="pop">
                    <span>{payload}</span>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </React.Fragment>
          )}
        </Tooltip.Root>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await act(async () => trigger1.focus());
      const popupElement = screen.getByTestId('popup');
      const positionerElement = screen.getByTestId('positioner');

      await act(async () => trigger2.focus());
      expect(screen.getByTestId('positioner')).to.equal(positionerElement);
      expect(screen.getByTestId('popup')).to.equal(popupElement);
    });

    it('should allow controlling the tooltip state programmatically', async () => {
      function Test() {
        const [open, setOpen] = React.useState(false);
        const [activeTrigger, setActiveTrigger] = React.useState<string | null>(null);

        return (
          <div>
            <Tooltip.Root
              open={open}
              triggerId={activeTrigger}
              onOpenChange={(nextOpen, details) => {
                setActiveTrigger(details.trigger?.id ?? null);
                setOpen(nextOpen);
              }}
            >
              {({ payload }: NumberPayload) => (
                <React.Fragment>
                  <Tooltip.Trigger payload={1} id="trigger-1" delay={0}>
                    Trigger 1
                  </Tooltip.Trigger>
                  <Tooltip.Trigger payload={2} id="trigger-2" delay={0}>
                    Trigger 2
                  </Tooltip.Trigger>

                  <Tooltip.Portal>
                    <Tooltip.Positioner>
                      <Tooltip.Popup>
                        <span data-testid="content">{payload as number}</span>
                      </Tooltip.Popup>
                    </Tooltip.Positioner>
                  </Tooltip.Portal>
                </React.Fragment>
              )}
            </Tooltip.Root>
            <button
              onClick={() => {
                setOpen(true);
                setActiveTrigger('trigger-1');
              }}
            >
              Open Trigger 1
            </button>
            <button
              onClick={() => {
                setOpen(true);
                setActiveTrigger('trigger-2');
              }}
            >
              Open Trigger 2
            </button>
            <button onClick={() => setOpen(false)}>Close</button>
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

    it('allows setting an initially open tooltip', async () => {
      const testTooltip = Tooltip.createHandle<number>();
      const triggerId = randomStringValue();
      await render(
        <Tooltip.Root handle={testTooltip} defaultOpen defaultTriggerId={triggerId}>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <button type="button" aria-label="Initial focus" autoFocus />
              <Tooltip.Trigger handle={testTooltip} payload={1}>
                Trigger 1
              </Tooltip.Trigger>
              <Tooltip.Trigger handle={testTooltip} payload={2} id={triggerId}>
                Trigger 2
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup data-testid="popup">
                    <span>{payload}</span>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </React.Fragment>
          )}
        </Tooltip.Root>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('popup').textContent).to.equal('2');
      });
    });
  });

  describe.skipIf(isJSDOM)('multiple detached triggers', () => {
    type NumberPayload = { payload: number | undefined };

    it('should open the tooltip with any trigger on hover', async () => {
      const testTooltip = Tooltip.createHandle();
      const popupId = randomStringValue();
      const { user } = await render(
        <div>
          <button type="button" aria-label="Initial focus" autoFocus />
          <Tooltip.Trigger handle={testTooltip} delay={0}>
            Trigger 1
          </Tooltip.Trigger>
          <Tooltip.Trigger handle={testTooltip} delay={0}>
            Trigger 2
          </Tooltip.Trigger>
          <Tooltip.Trigger handle={testTooltip} delay={0}>
            Trigger 3
          </Tooltip.Trigger>

          <Tooltip.Root handle={testTooltip}>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid={popupId}>Tooltip Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).to.equal(null);
      });

      await user.hover(trigger1);
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).toBeVisible();
      });
      await user.unhover(trigger1);
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).to.equal(null);
      });

      await user.hover(trigger2);
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).toBeVisible();
      });
      await user.unhover(trigger2);
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).to.equal(null);
      });

      await user.hover(trigger3);
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).toBeVisible();
      });
      await user.unhover(trigger3);
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).to.equal(null);
      });
    });

    it('should open the tooltip with any trigger on focus', async () => {
      const testTooltip = Tooltip.createHandle();
      await render(
        <div>
          <Tooltip.Trigger handle={testTooltip}>Trigger 1</Tooltip.Trigger>
          <Tooltip.Trigger handle={testTooltip}>Trigger 2</Tooltip.Trigger>
          <Tooltip.Trigger handle={testTooltip}>Trigger 3</Tooltip.Trigger>

          <Tooltip.Root handle={testTooltip}>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup>Tooltip Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('button', { name: 'Trigger 3' });

      expect(screen.queryByText('Tooltip Content')).to.equal(null);

      await act(async () => trigger1.focus());
      await flushMicrotasks();
      expect(screen.getByText('Tooltip Content')).toBeVisible();
      await act(async () => trigger1.blur());
      expect(screen.queryByText('Tooltip Content')).to.equal(null);

      await act(async () => trigger2.focus());
      await flushMicrotasks();
      expect(screen.getByText('Tooltip Content')).toBeVisible();
      await act(async () => trigger2.blur());
      expect(screen.queryByText('Tooltip Content')).to.equal(null);

      await act(async () => trigger3.focus());
      await flushMicrotasks();
      expect(screen.getByText('Tooltip Content')).toBeVisible();
      await act(async () => trigger3.blur());
      expect(screen.queryByText('Tooltip Content')).to.equal(null);
    });

    it('should set the payload and render content based on its value', async () => {
      const testTooltip = Tooltip.createHandle<number>();
      const { user } = await render(
        <div>
          <Tooltip.Trigger handle={testTooltip} payload={1} delay={0}>
            Trigger 1
          </Tooltip.Trigger>
          <Tooltip.Trigger handle={testTooltip} payload={2} delay={0}>
            Trigger 2
          </Tooltip.Trigger>

          <Tooltip.Root handle={testTooltip}>
            {({ payload }: NumberPayload) => (
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>
                    <span data-testid="content">{payload}</span>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.hover(trigger1);
      expect(screen.getByTestId('content').textContent).to.equal('1');

      await user.unhover(trigger1);
      await user.hover(trigger2);
      expect(screen.getByTestId('content').textContent).to.equal('2');
    });

    it('should reuse the popup and positioner DOM nodes when switching triggers', async () => {
      const testTooltip = Tooltip.createHandle<number>();
      await render(
        <React.Fragment>
          <Tooltip.Trigger handle={testTooltip} payload={1} delay={0}>
            Trigger 1
          </Tooltip.Trigger>
          <Tooltip.Trigger handle={testTooltip} payload={2} delay={0}>
            Trigger 2
          </Tooltip.Trigger>

          <Tooltip.Root handle={testTooltip}>
            {({ payload }: NumberPayload) => (
              <Tooltip.Portal>
                <Tooltip.Positioner data-testid="positioner">
                  <Tooltip.Popup data-testid="popup">
                    <span>{payload}</span>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </React.Fragment>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await act(async () => trigger1.focus());
      const popupElement = screen.getByTestId('popup');
      const positionerElement = screen.getByTestId('positioner');

      await act(async () => trigger2.focus());
      expect(screen.getByTestId('popup')).to.equal(popupElement);
      expect(screen.getByTestId('positioner')).to.equal(positionerElement);
    });

    it('should allow controlling the tooltip state programmatically', async () => {
      const testTooltip = Tooltip.createHandle<number>();
      function Test() {
        const [open, setOpen] = React.useState(false);
        const [activeTrigger, setActiveTrigger] = React.useState<string | null>(null);

        return (
          <div style={{ margin: 50 }}>
            <Tooltip.Trigger handle={testTooltip} payload={1} id="trigger-1" delay={0}>
              Trigger 1
            </Tooltip.Trigger>
            <Tooltip.Trigger handle={testTooltip} payload={2} id="trigger-2" delay={0}>
              Trigger 2
            </Tooltip.Trigger>

            <Tooltip.Root
              open={open}
              onOpenChange={(nextOpen, details) => {
                setActiveTrigger(details.trigger?.id ?? null);
                setOpen(nextOpen);
              }}
              triggerId={activeTrigger}
              handle={testTooltip}
            >
              {({ payload }: NumberPayload) => (
                <Tooltip.Portal>
                  <Tooltip.Positioner data-testid="positioner" side="bottom" align="start">
                    <Tooltip.Popup>
                      <span data-testid="content">{payload}</span>
                    </Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>

            <button
              onClick={() => {
                setOpen(true);
                setActiveTrigger('trigger-1');
              }}
            >
              Open Trigger 1
            </button>
            <button
              onClick={() => {
                setOpen(true);
                setActiveTrigger('trigger-2');
              }}
            >
              Open Trigger 2
            </button>
            <button onClick={() => setOpen(false)}>Close</button>
          </div>
        );
      }

      const { user } = await render(<Test />);

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      await user.click(screen.getByRole('button', { name: 'Open Trigger 1' }));
      expect(screen.getByTestId('content').textContent).to.equal('1');

      await waitFor(() => {
        expect(screen.getByTestId('positioner').getBoundingClientRect().left).to.be.approximately(
          trigger1.getBoundingClientRect().left,
          1,
        );
      });

      await user.click(screen.getByRole('button', { name: 'Open Trigger 2' }));
      expect(screen.getByTestId('content').textContent).to.equal('2');
      await waitFor(() => {
        expect(screen.getByTestId('positioner').getBoundingClientRect().left).to.be.approximately(
          trigger2.getBoundingClientRect().left,
          1,
        );
      });

      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByTestId('content')).to.equal(null);
    });

    it('allows setting an initially open tooltip', async () => {
      const testTooltip = Tooltip.createHandle<number>();
      const triggerId = randomStringValue();
      await render(
        <React.Fragment>
          <button type="button" aria-label="Initial focus" autoFocus />
          <Tooltip.Trigger handle={testTooltip} payload={1}>
            Trigger 1
          </Tooltip.Trigger>
          <Tooltip.Trigger handle={testTooltip} payload={2} id={triggerId}>
            Trigger 2
          </Tooltip.Trigger>

          <Tooltip.Root handle={testTooltip} defaultOpen defaultTriggerId={triggerId}>
            {({ payload }: NumberPayload) => (
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup data-testid="popup">
                    <span>{payload}</span>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </React.Fragment>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('popup').textContent).to.equal('2');
      });
    });

    it('should not have inline scale style after switching triggers', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const testTooltip = Tooltip.createHandle<number>();

      function Test() {
        return (
          <React.Fragment>
            <button type="button" aria-label="Initial focus" autoFocus />
            <Tooltip.Trigger handle={testTooltip} payload={1} delay={0}>
              Trigger 1
            </Tooltip.Trigger>
            <Tooltip.Trigger handle={testTooltip} payload={2} delay={0}>
              Trigger 2
            </Tooltip.Trigger>

            <Tooltip.Root handle={testTooltip}>
              {({ payload }: NumberPayload) => (
                <Tooltip.Portal>
                  <Tooltip.Positioner>
                    <Tooltip.Popup data-testid="popup">
                      <Tooltip.Viewport>
                        <span data-testid="content">{payload}</span>
                      </Tooltip.Viewport>
                    </Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </React.Fragment>
        );
      }

      const { user } = await render(<Test />);

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });

      // Open with Trigger 1
      await user.hover(trigger1);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('1');
      });

      // Switch to Trigger 2
      await user.unhover(trigger1);
      await user.hover(trigger2);
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('2');
      });

      // The popup should not have an inline scale style that would override CSS transitions
      const popup = screen.getByTestId('popup');
      expect(popup.style.scale).to.equal('');
    });
  });

  describe.skipIf(isJSDOM)('imperative actions on the handle', () => {
    it('opens and closes the tooltip', async () => {
      const tooltip = Tooltip.createHandle();
      await render(
        <div>
          <Tooltip.Trigger handle={tooltip} id="trigger">
            Trigger
          </Tooltip.Trigger>
          <Tooltip.Root handle={tooltip}>
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup data-testid="content">Content</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>,
      );

      const trigger = screen.getByRole('button', { name: 'Trigger' });
      expect(screen.queryByTestId('content')).to.equal(null);

      await act(() => tooltip.open('trigger'));
      await waitFor(() => {
        expect(screen.queryByTestId('content')).not.to.equal(null);
      });

      expect(screen.getByTestId('content').textContent).to.equal('Content');
      expect(trigger).to.have.attribute('data-popup-open');

      await act(() => tooltip.close());
      await waitFor(() => {
        expect(screen.queryByTestId('content')).to.equal(null);
      });

      expect(trigger).not.to.have.attribute('data-popup-open');
    });

    it('sets the payload associated with the trigger', async () => {
      const tooltip = Tooltip.createHandle<number>();
      await render(
        <div>
          <Tooltip.Trigger handle={tooltip} id="trigger1" payload={1}>
            Trigger 1
          </Tooltip.Trigger>
          <Tooltip.Trigger handle={tooltip} id="trigger2" payload={2}>
            Trigger 2
          </Tooltip.Trigger>
          <Tooltip.Root handle={tooltip}>
            {({ payload }: { payload: number | undefined }) => (
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup data-testid="content">{payload}</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('button', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('button', { name: 'Trigger 2' });
      expect(screen.queryByTestId('content')).to.equal(null);

      await act(() => tooltip.open('trigger2'));
      await waitFor(() => {
        expect(screen.queryByTestId('content')).not.to.equal(null);
      });

      expect(screen.getByTestId('content').textContent).to.equal('2');
      expect(trigger2).to.have.attribute('data-popup-open');
      expect(trigger1).not.to.have.attribute('data-popup-open');

      await act(() => tooltip.close());
      await waitFor(() => {
        expect(screen.queryByTestId('content')).to.equal(null);
      });

      expect(trigger2).not.to.have.attribute('data-popup-open');
    });
  });
});
