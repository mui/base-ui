import * as React from 'react';
import { createRenderer, isJSDOM } from '#test-utils';
import { PreviewCard } from '@base-ui/react/preview-card';
import { screen, waitFor, randomStringValue, act, flushMicrotasks } from '@mui/internal-test-utils';

describe('<PreviewCard.Root />', () => {
  beforeEach(async () => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  describe.skipIf(isJSDOM)('multiple triggers within Root', () => {
    type NumberPayload = { payload: number | undefined };

    it('should open the preview card with any trigger on hover', async () => {
      const popupId = randomStringValue();
      const { user } = await render(
        <PreviewCard.Root>
          <button type="button" aria-label="Initial focus" autoFocus />
          <PreviewCard.Trigger href="#" delay={0}>
            Trigger 1
          </PreviewCard.Trigger>
          <PreviewCard.Trigger href="#" delay={0}>
            Trigger 2
          </PreviewCard.Trigger>
          <PreviewCard.Trigger href="#" delay={0}>
            Trigger 3
          </PreviewCard.Trigger>

          <PreviewCard.Portal>
            <PreviewCard.Positioner>
              <PreviewCard.Popup data-testid={popupId}>Content</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      const trigger1 = screen.getByRole('link', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('link', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('link', { name: 'Trigger 3' });

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

    it('should open the preview card immediately when hovering another trigger', async () => {
      const popupId = randomStringValue();
      const { user } = await render(
        <PreviewCard.Root>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <button type="button" aria-label="Initial focus" autoFocus />
              <PreviewCard.Trigger href="#" delay={0} payload={1}>
                Trigger 1
              </PreviewCard.Trigger>

              {/* delay should be ignored when moving from already active trigger */}
              <PreviewCard.Trigger href="#" delay={2000} payload={2}>
                Trigger 2
              </PreviewCard.Trigger>

              <PreviewCard.Portal>
                <PreviewCard.Positioner>
                  <PreviewCard.Popup data-testid={popupId}>Content: {payload}</PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            </React.Fragment>
          )}
        </PreviewCard.Root>,
      );

      const trigger1 = screen.getByRole('link', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('link', { name: 'Trigger 2' });

      await user.hover(trigger1);
      expect(screen.queryByTestId(popupId)).toBeVisible();
      expect(screen.getByTestId(popupId).textContent).to.equal('Content: 1');

      await user.hover(trigger2);
      expect(screen.queryByTestId(popupId)).toBeVisible();
      expect(screen.getByTestId(popupId).textContent).to.equal('Content: 2');
    });

    it('should open the preview card with any trigger on focus', async () => {
      await render(
        <PreviewCard.Root>
          <button type="button" aria-label="Initial focus" autoFocus />
          <PreviewCard.Trigger href="#" delay={0}>
            Trigger 1
          </PreviewCard.Trigger>
          <PreviewCard.Trigger href="#" delay={0}>
            Trigger 2
          </PreviewCard.Trigger>
          <PreviewCard.Trigger href="#" delay={0}>
            Trigger 3
          </PreviewCard.Trigger>

          <PreviewCard.Portal>
            <PreviewCard.Positioner>
              <PreviewCard.Popup>Content</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      const trigger1 = screen.getByRole('link', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('link', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('link', { name: 'Trigger 3' });

      expect(screen.queryByText('Content')).to.equal(null);

      await act(async () => trigger1.focus());
      await flushMicrotasks();
      expect(screen.getByText('Content')).toBeVisible();
      await act(async () => trigger1.blur());
      expect(screen.queryByText('Content')).to.equal(null);

      await act(async () => trigger2.focus());
      await flushMicrotasks();
      expect(screen.getByText('Content')).toBeVisible();
      await act(async () => trigger2.blur());
      expect(screen.queryByText('Content')).to.equal(null);

      await act(async () => trigger3.focus());
      await flushMicrotasks();
      expect(screen.getByText('Content')).toBeVisible();
      await act(async () => trigger3.blur());
      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should open again after escape when focusing another trigger', async () => {
      const popupId = randomStringValue();
      const { user } = await render(
        <PreviewCard.Root>
          <button type="button" aria-label="Initial focus" autoFocus />
          <PreviewCard.Trigger href="#" delay={0}>
            Trigger 1
          </PreviewCard.Trigger>
          <PreviewCard.Trigger href="#" delay={0}>
            Trigger 2
          </PreviewCard.Trigger>

          <PreviewCard.Portal>
            <PreviewCard.Positioner>
              <PreviewCard.Popup data-testid={popupId}>Content</PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>,
      );

      const trigger1 = screen.getByRole('link', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('link', { name: 'Trigger 2' });

      await act(async () => trigger1.focus());
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).toBeVisible();
      });

      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).to.equal(null);
      });

      await act(async () => trigger2.focus());
      await waitFor(() => {
        expect(screen.queryByTestId(popupId)).toBeVisible();
      });
    });

    it('should switch immediately when focusing another trigger while open', async () => {
      await render(
        <PreviewCard.Root>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <button type="button" aria-label="Initial focus" autoFocus />
              <PreviewCard.Trigger href="#" payload={1} delay={0}>
                Trigger 1
              </PreviewCard.Trigger>
              <PreviewCard.Trigger href="#" payload={2} delay={2000}>
                Trigger 2
              </PreviewCard.Trigger>

              <PreviewCard.Portal>
                <PreviewCard.Positioner>
                  <PreviewCard.Popup>
                    <span data-testid="content">{payload}</span>
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            </React.Fragment>
          )}
        </PreviewCard.Root>,
      );

      const trigger1 = screen.getByRole('link', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('link', { name: 'Trigger 2' });

      await act(async () => trigger1.focus());
      await flushMicrotasks();
      await waitFor(() => {
        expect(screen.getByTestId('content').textContent).to.equal('1');
      });

      await act(async () => trigger2.focus());
      await flushMicrotasks();
      expect(screen.getByTestId('content').textContent).to.equal('2');
    });

    it('should set the payload and render content based on its value', async () => {
      const { user } = await render(
        <PreviewCard.Root>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <button type="button" aria-label="Initial focus" autoFocus />
              <PreviewCard.Trigger href="#" payload={1} delay={0}>
                Trigger 1
              </PreviewCard.Trigger>
              <PreviewCard.Trigger href="#" payload={2} delay={0}>
                Trigger 2
              </PreviewCard.Trigger>

              <PreviewCard.Portal>
                <PreviewCard.Positioner>
                  <PreviewCard.Popup>
                    <span data-testid="content">{payload}</span>
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            </React.Fragment>
          )}
        </PreviewCard.Root>,
      );

      const trigger1 = screen.getByRole('link', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('link', { name: 'Trigger 2' });

      await user.hover(trigger1);
      expect(screen.getByTestId('content').textContent).to.equal('1');

      await user.unhover(trigger1);
      await user.hover(trigger2);
      expect(screen.getByTestId('content').textContent).to.equal('2');
    });

    it('should reuse the popup and positioner DOM nodes when switching triggers', async () => {
      await render(
        <PreviewCard.Root>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <button type="button" aria-label="Initial focus" autoFocus />
              <PreviewCard.Trigger href="#" payload={1} delay={0}>
                Trigger 1
              </PreviewCard.Trigger>
              <PreviewCard.Trigger href="#" payload={2} delay={0}>
                Trigger 2
              </PreviewCard.Trigger>

              <PreviewCard.Portal>
                <PreviewCard.Positioner data-testid="positioner" key="pos">
                  <PreviewCard.Popup data-testid="popup" key="pop">
                    <span>{payload}</span>
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            </React.Fragment>
          )}
        </PreviewCard.Root>,
      );

      const trigger1 = screen.getByRole('link', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('link', { name: 'Trigger 2' });

      await act(async () => trigger1.focus());
      const popupElement = screen.getByTestId('popup');
      const positionerElement = screen.getByTestId('positioner');

      await act(async () => trigger2.focus());
      expect(screen.getByTestId('positioner')).to.equal(positionerElement);
      expect(screen.getByTestId('popup')).to.equal(popupElement);
    });

    it('should allow controlling the preview card state programmatically', async () => {
      function Test() {
        const [open, setOpen] = React.useState(false);
        const [activeTrigger, setActiveTrigger] = React.useState<string | null>(null);

        return (
          <div>
            <button type="button" aria-label="Initial focus" autoFocus />
            <PreviewCard.Root
              open={open}
              triggerId={activeTrigger}
              onOpenChange={(nextOpen, details) => {
                setActiveTrigger(details.trigger?.id ?? null);
                setOpen(nextOpen);
              }}
            >
              {({ payload }: NumberPayload) => (
                <React.Fragment>
                  <PreviewCard.Trigger href="#" payload={1} id="trigger-1" delay={0}>
                    Trigger 1
                  </PreviewCard.Trigger>
                  <PreviewCard.Trigger href="#" payload={2} id="trigger-2" delay={0}>
                    Trigger 2
                  </PreviewCard.Trigger>

                  <PreviewCard.Portal>
                    <PreviewCard.Positioner>
                      <PreviewCard.Popup>
                        <span data-testid="content">{payload as number}</span>
                      </PreviewCard.Popup>
                    </PreviewCard.Positioner>
                  </PreviewCard.Portal>
                </React.Fragment>
              )}
            </PreviewCard.Root>
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

    it('allows setting an initially open preview card', async () => {
      const testPreviewCard = PreviewCard.createHandle<number>();
      const triggerId = randomStringValue();
      await render(
        <PreviewCard.Root handle={testPreviewCard} defaultOpen defaultTriggerId={triggerId}>
          {({ payload }: NumberPayload) => (
            <React.Fragment>
              <button type="button" aria-label="Initial focus" autoFocus />
              <PreviewCard.Trigger href="#" handle={testPreviewCard} payload={1}>
                Trigger 1
              </PreviewCard.Trigger>
              <PreviewCard.Trigger href="#" handle={testPreviewCard} payload={2} id={triggerId}>
                Trigger 2
              </PreviewCard.Trigger>
              <PreviewCard.Portal>
                <PreviewCard.Positioner>
                  <PreviewCard.Popup data-testid="popup">
                    <span>{payload}</span>
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            </React.Fragment>
          )}
        </PreviewCard.Root>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('popup').textContent).to.equal('2');
      });
    });
  });

  describe.skipIf(isJSDOM)('multiple detached triggers', () => {
    type NumberPayload = { payload: number | undefined };

    it('should open the preview card with any trigger on hover', async () => {
      const testPreviewCard = PreviewCard.createHandle();
      const popupId = randomStringValue();
      const { user } = await render(
        <div>
          <button type="button" aria-label="Initial focus" autoFocus />
          <PreviewCard.Trigger href="#" handle={testPreviewCard} delay={0}>
            Trigger 1
          </PreviewCard.Trigger>
          <PreviewCard.Trigger href="#" handle={testPreviewCard} delay={0}>
            Trigger 2
          </PreviewCard.Trigger>
          <PreviewCard.Trigger href="#" handle={testPreviewCard} delay={0}>
            Trigger 3
          </PreviewCard.Trigger>

          <PreviewCard.Root handle={testPreviewCard}>
            <PreviewCard.Portal>
              <PreviewCard.Positioner>
                <PreviewCard.Popup data-testid={popupId}>Content</PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </PreviewCard.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('link', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('link', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('link', { name: 'Trigger 3' });

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

    it('should open the preview card with any trigger on focus', async () => {
      const testPreviewCard = PreviewCard.createHandle();
      await render(
        <div>
          <button type="button" aria-label="Initial focus" autoFocus />
          <PreviewCard.Trigger href="#" handle={testPreviewCard} delay={0}>
            Trigger 1
          </PreviewCard.Trigger>
          <PreviewCard.Trigger href="#" handle={testPreviewCard} delay={0}>
            Trigger 2
          </PreviewCard.Trigger>
          <PreviewCard.Trigger href="#" handle={testPreviewCard} delay={0}>
            Trigger 3
          </PreviewCard.Trigger>

          <PreviewCard.Root handle={testPreviewCard}>
            <PreviewCard.Portal>
              <PreviewCard.Positioner>
                <PreviewCard.Popup>Content</PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </PreviewCard.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('link', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('link', { name: 'Trigger 2' });
      const trigger3 = screen.getByRole('link', { name: 'Trigger 3' });

      expect(screen.queryByText('Content')).to.equal(null);

      await act(async () => trigger1.focus());
      await flushMicrotasks();
      expect(screen.getByText('Content')).toBeVisible();
      await act(async () => trigger1.blur());
      expect(screen.queryByText('Content')).to.equal(null);

      await act(async () => trigger2.focus());
      await flushMicrotasks();
      expect(screen.getByText('Content')).toBeVisible();
      await act(async () => trigger2.blur());
      expect(screen.queryByText('Content')).to.equal(null);

      await act(async () => trigger3.focus());
      await flushMicrotasks();
      expect(screen.getByText('Content')).toBeVisible();
      await act(async () => trigger3.blur());
      expect(screen.queryByText('Content')).to.equal(null);
    });

    it('should set the payload and render content based on its value', async () => {
      const testPreviewCard = PreviewCard.createHandle<number>();
      const { user } = await render(
        <div>
          <button type="button" aria-label="Initial focus" autoFocus />
          <PreviewCard.Trigger href="#" handle={testPreviewCard} payload={1} delay={0}>
            Trigger 1
          </PreviewCard.Trigger>
          <PreviewCard.Trigger href="#" handle={testPreviewCard} payload={2} delay={0}>
            Trigger 2
          </PreviewCard.Trigger>

          <PreviewCard.Root handle={testPreviewCard}>
            {({ payload }: NumberPayload) => (
              <PreviewCard.Portal>
                <PreviewCard.Positioner>
                  <PreviewCard.Popup>
                    <span data-testid="content">{payload}</span>
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            )}
          </PreviewCard.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('link', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('link', { name: 'Trigger 2' });

      await user.hover(trigger1);
      expect(screen.getByTestId('content').textContent).to.equal('1');

      await user.unhover(trigger1);
      await user.hover(trigger2);
      expect(screen.getByTestId('content').textContent).to.equal('2');
    });

    it('should reuse the popup and positioner DOM nodes when switching triggers', async () => {
      const testPreviewCard = PreviewCard.createHandle<number>();
      await render(
        <React.Fragment>
          <button type="button" aria-label="Initial focus" autoFocus />
          <PreviewCard.Trigger href="#" handle={testPreviewCard} payload={1} delay={0}>
            Trigger 1
          </PreviewCard.Trigger>
          <PreviewCard.Trigger href="#" handle={testPreviewCard} payload={2} delay={0}>
            Trigger 2
          </PreviewCard.Trigger>

          <PreviewCard.Root handle={testPreviewCard}>
            {({ payload }: NumberPayload) => (
              <PreviewCard.Portal>
                <PreviewCard.Positioner data-testid="positioner">
                  <PreviewCard.Popup data-testid="popup">
                    <span>{payload}</span>
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            )}
          </PreviewCard.Root>
        </React.Fragment>,
      );

      const trigger1 = screen.getByRole('link', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('link', { name: 'Trigger 2' });

      await act(async () => trigger1.focus());
      const popupElement = screen.getByTestId('popup');
      const positionerElement = screen.getByTestId('positioner');

      await act(async () => trigger2.focus());
      expect(screen.getByTestId('popup')).to.equal(popupElement);
      expect(screen.getByTestId('positioner')).to.equal(positionerElement);
    });

    it('should allow controlling the preview card state programmatically', async () => {
      const testPreviewCard = PreviewCard.createHandle<number>();
      function Test() {
        const [open, setOpen] = React.useState(false);
        const [activeTrigger, setActiveTrigger] = React.useState<string | null>(null);

        return (
          <div style={{ margin: 50 }}>
            <button type="button" aria-label="Initial focus" autoFocus />
            <PreviewCard.Trigger
              href="#"
              handle={testPreviewCard}
              payload={1}
              id="trigger-1"
              delay={0}
            >
              Trigger 1
            </PreviewCard.Trigger>
            <PreviewCard.Trigger
              href="#"
              handle={testPreviewCard}
              payload={2}
              id="trigger-2"
              delay={0}
            >
              Trigger 2
            </PreviewCard.Trigger>

            <PreviewCard.Root
              open={open}
              onOpenChange={(nextOpen, details) => {
                setActiveTrigger(details.trigger?.id ?? null);
                setOpen(nextOpen);
              }}
              triggerId={activeTrigger}
              handle={testPreviewCard}
            >
              {({ payload }: NumberPayload) => (
                <PreviewCard.Portal>
                  <PreviewCard.Positioner data-testid="positioner" side="bottom" align="start">
                    <PreviewCard.Popup>
                      <span data-testid="content">{payload}</span>
                    </PreviewCard.Popup>
                  </PreviewCard.Positioner>
                </PreviewCard.Portal>
              )}
            </PreviewCard.Root>

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

      const trigger1 = screen.getByRole('link', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('link', { name: 'Trigger 2' });

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

    it('allows setting an initially open preview card', async () => {
      const testPreviewCard = PreviewCard.createHandle<number>();
      const triggerId = randomStringValue();
      await render(
        <React.Fragment>
          <button type="button" aria-label="Initial focus" autoFocus />
          <PreviewCard.Trigger href="#" handle={testPreviewCard} payload={1}>
            Trigger 1
          </PreviewCard.Trigger>
          <PreviewCard.Trigger href="#" handle={testPreviewCard} payload={2} id={triggerId}>
            Trigger 2
          </PreviewCard.Trigger>

          <PreviewCard.Root handle={testPreviewCard} defaultOpen defaultTriggerId={triggerId}>
            {({ payload }: NumberPayload) => (
              <PreviewCard.Portal>
                <PreviewCard.Positioner>
                  <PreviewCard.Popup data-testid="popup">
                    <span>{payload}</span>
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            )}
          </PreviewCard.Root>
        </React.Fragment>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('popup').textContent).to.equal('2');
      });
    });

    it('should not have inline scale style after switching triggers', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const testPreviewCard = PreviewCard.createHandle<number>();

      function Test() {
        return (
          <React.Fragment>
            <button type="button" aria-label="Initial focus" autoFocus />
            <PreviewCard.Trigger href="#" handle={testPreviewCard} payload={1} delay={0}>
              Trigger 1
            </PreviewCard.Trigger>
            <PreviewCard.Trigger href="#" handle={testPreviewCard} payload={2} delay={0}>
              Trigger 2
            </PreviewCard.Trigger>

            <PreviewCard.Root handle={testPreviewCard}>
              {({ payload }: NumberPayload) => (
                <PreviewCard.Portal>
                  <PreviewCard.Positioner>
                    <PreviewCard.Popup data-testid="popup">
                      <PreviewCard.Viewport>
                        <span data-testid="content">{payload}</span>
                      </PreviewCard.Viewport>
                    </PreviewCard.Popup>
                  </PreviewCard.Positioner>
                </PreviewCard.Portal>
              )}
            </PreviewCard.Root>
          </React.Fragment>
        );
      }

      const { user } = await render(<Test />);

      const trigger1 = screen.getByRole('link', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('link', { name: 'Trigger 2' });

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
    it('opens and closes the preview card', async () => {
      const handle = PreviewCard.createHandle();
      await render(
        <div>
          <button type="button" aria-label="Initial focus" autoFocus />
          <PreviewCard.Trigger href="#" handle={handle} id="trigger">
            Trigger
          </PreviewCard.Trigger>
          <PreviewCard.Root handle={handle}>
            <PreviewCard.Portal>
              <PreviewCard.Positioner>
                <PreviewCard.Popup data-testid="content">Content</PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </PreviewCard.Root>
        </div>,
      );

      const trigger = screen.getByRole('link', { name: 'Trigger' });
      expect(screen.queryByTestId('content')).to.equal(null);

      await act(() => handle.open('trigger'));
      await waitFor(() => {
        expect(screen.queryByTestId('content')).not.to.equal(null);
      });

      expect(screen.getByTestId('content').textContent).to.equal('Content');
      expect(trigger).to.have.attribute('data-popup-open');

      await act(() => handle.close());
      await waitFor(() => {
        expect(screen.queryByTestId('content')).to.equal(null);
      });

      expect(trigger).not.to.have.attribute('data-popup-open');
    });

    it('sets the payload associated with the trigger', async () => {
      const handle = PreviewCard.createHandle<number>();
      await render(
        <div>
          <button type="button" aria-label="Initial focus" autoFocus />
          <PreviewCard.Trigger href="#" handle={handle} id="trigger1" payload={1}>
            Trigger 1
          </PreviewCard.Trigger>
          <PreviewCard.Trigger href="#" handle={handle} id="trigger2" payload={2}>
            Trigger 2
          </PreviewCard.Trigger>
          <PreviewCard.Root handle={handle}>
            {({ payload }: { payload: number | undefined }) => (
              <PreviewCard.Portal>
                <PreviewCard.Positioner>
                  <PreviewCard.Popup data-testid="content">{payload}</PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            )}
          </PreviewCard.Root>
        </div>,
      );

      const trigger1 = screen.getByRole('link', { name: 'Trigger 1' });
      const trigger2 = screen.getByRole('link', { name: 'Trigger 2' });
      expect(screen.queryByTestId('content')).to.equal(null);

      await act(() => handle.open('trigger2'));
      await waitFor(() => {
        expect(screen.queryByTestId('content')).not.to.equal(null);
      });

      expect(screen.getByTestId('content').textContent).to.equal('2');
      expect(trigger2).to.have.attribute('data-popup-open');
      expect(trigger1).not.to.have.attribute('data-popup-open');

      await act(() => handle.close());
      await waitFor(() => {
        expect(screen.queryByTestId('content')).to.equal(null);
      });

      expect(trigger2).not.to.have.attribute('data-popup-open');
    });
  });
});
