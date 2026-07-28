import { expect, vi } from 'vitest';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Toast } from '@base-ui/react/toast';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { List, Button } from '../utils/test-utils';

describe('<Toast.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(<Toast.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Toast.Provider>{node}</Toast.Provider>);
    },
  }));

  it.skipIf(!isJSDOM)(
    'rebinds owner-document listeners once across empty store cycles',
    async () => {
      const iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      const iframeWindow = iframe.contentWindow;
      const iframeDocument = iframe.contentDocument;
      if (!iframeWindow || !iframeDocument) {
        throw new Error('Expected iframe window and document.');
      }
      const iframeGlobal = iframeWindow as Window & typeof globalThis;

      const portalContainer = iframeDocument.createElement('div');
      iframeDocument.body.appendChild(portalContainer);
      const addWindowListener = vi.spyOn(iframeWindow, 'addEventListener');
      const removeWindowListener = vi.spyOn(iframeWindow, 'removeEventListener');
      const addDocumentListener = vi.spyOn(iframeDocument, 'addEventListener');
      const removeDocumentListener = vi.spyOn(iframeDocument, 'removeEventListener');

      function Controls() {
        const { add, close, toasts } = Toast.useToastManager();
        return (
          <React.Fragment>
            <button type="button" onClick={() => add({ title: 'title' })}>
              add alternate toast
            </button>
            <button type="button" onClick={() => close(toasts[0]?.id)}>
              close alternate toast
            </button>
          </React.Fragment>
        );
      }

      try {
        const { user } = await render(
          <Toast.Provider timeout={0}>
            {ReactDOM.createPortal(
              <Toast.Viewport data-testid="alternate-viewport">
                <List />
              </Toast.Viewport>,
              portalContainer,
            )}
            <Controls />
          </Toast.Provider>,
        );

        const add = screen.getByRole('button', { name: 'add alternate toast' });
        const close = screen.getByRole('button', { name: 'close alternate toast' });

        await user.click(add);
        await waitFor(() =>
          expect(iframeDocument.querySelector('[data-testid="root"]')).not.toBe(null),
        );

        expect(addWindowListener.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1);
        expect(addWindowListener.mock.calls.filter(([type]) => type === 'blur')).toHaveLength(1);
        expect(addWindowListener.mock.calls.filter(([type]) => type === 'focus')).toHaveLength(1);
        expect(
          addDocumentListener.mock.calls.filter(([type]) => type === 'pointerdown'),
        ).toHaveLength(1);

        await act(async () => {
          iframeWindow.dispatchEvent(new iframeGlobal.KeyboardEvent('keydown', { key: 'F6' }));
        });
        expect(iframeDocument.activeElement).toBe(
          iframeDocument.querySelector('[data-testid="alternate-viewport"]'),
        );

        await user.click(close);
        await waitFor(() =>
          expect(iframeDocument.querySelector('[data-testid="root"]')).toBe(null),
        );
        expect(removeWindowListener.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(
          1,
        );
        expect(removeWindowListener.mock.calls.filter(([type]) => type === 'blur')).toHaveLength(1);
        expect(removeWindowListener.mock.calls.filter(([type]) => type === 'focus')).toHaveLength(
          1,
        );
        expect(
          removeDocumentListener.mock.calls.filter(([type]) => type === 'pointerdown'),
        ).toHaveLength(1);

        await user.click(add);
        await waitFor(() =>
          expect(iframeDocument.querySelector('[data-testid="root"]')).not.toBe(null),
        );
        expect(addWindowListener.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(2);
        expect(addWindowListener.mock.calls.filter(([type]) => type === 'blur')).toHaveLength(2);
        expect(addWindowListener.mock.calls.filter(([type]) => type === 'focus')).toHaveLength(2);
        expect(
          addDocumentListener.mock.calls.filter(([type]) => type === 'pointerdown'),
        ).toHaveLength(2);
      } finally {
        addWindowListener.mockRestore();
        removeWindowListener.mockRestore();
        addDocumentListener.mockRestore();
        removeDocumentListener.mockRestore();
        iframe.remove();
      }
    },
  );

  it('throws a descriptive error when rendered outside <Toast.Provider>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Toast.Viewport />)).rejects.toThrow(
        'Base UI: useToastManager must be used within <Toast.Provider>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('gets focused when F6 is pressed', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport data-testid="viewport">
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });

    await user.click(button);
    await user.keyboard('{F6}');

    expect(screen.getByTestId('viewport')).toHaveFocus();
  });

  it('focuses first toast upon tab after viewport is focused', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });

    await user.click(button);
    await user.keyboard('{F6}');
    await user.keyboard('{Tab}');

    expect(screen.getByTestId('root')).toHaveFocus();
  });

  it('returns focus to previous element when pressing shift+Tab on first toast', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });

    await user.click(button);
    await user.keyboard('{F6}');
    await user.tab();
    await user.tab({ shift: true });

    expect(button).toHaveFocus();
  });

  it('returns focus to previous element when pressing shift+Tab on last toast', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport>
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });

    await user.click(button);
    await user.click(button);

    await user.keyboard('{F6}');
    await user.tab(); // first toast
    await user.tab(); // first toast close button
    await user.tab(); // first toast action button
    await user.tab(); // last toast
    await user.tab(); // last toast close button
    await user.tab(); // last toast action button
    await user.tab();

    expect(button).toHaveFocus();
  });

  it('removes expanded on mouseleave when focus-visible not inside', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport data-testid="viewport">
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });

    await user.click(button);
    const root = await screen.findByTestId('root');
    const viewport = screen.getByTestId('viewport');

    fireEvent.mouseEnter(root);
    expect(viewport).toHaveAttribute('data-expanded');

    fireEvent.mouseLeave(root);
    expect(viewport).not.toHaveAttribute('data-expanded');
  });

  it('keeps expanded on mouseleave when focus-visible is inside', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport data-testid="viewport">
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });
    await user.click(button);
    const root = await screen.findByTestId('root');
    const viewport = screen.getByTestId('viewport');

    await user.keyboard('{F6}');
    await user.tab();

    fireEvent.mouseEnter(root);
    expect(viewport).toHaveAttribute('data-expanded');
    fireEvent.mouseLeave(root);
    expect(viewport).toHaveAttribute('data-expanded');
  });

  it('keeps expanded during an active touch swipe even if mouseleave fires', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport data-testid="viewport">
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });
    await user.click(button);

    const root = await screen.findByTestId('root');
    const viewport = screen.getByTestId('viewport');

    Object.defineProperty(root, 'setPointerCapture', {
      value: () => {},
      configurable: true,
    });
    Object.defineProperty(root, 'releasePointerCapture', {
      value: () => {},
      configurable: true,
    });

    fireEvent.pointerDown(root, {
      clientX: 100,
      clientY: 100,
      button: 0,
      bubbles: true,
      pointerId: 1,
      pointerType: 'touch',
    });
    fireEvent.pointerMove(root, {
      clientX: 100,
      clientY: 120,
      bubbles: true,
      pointerId: 1,
      pointerType: 'touch',
    });

    expect(viewport).toHaveAttribute('data-expanded');

    fireEvent.mouseLeave(viewport);

    expect(viewport).toHaveAttribute('data-expanded');

    fireEvent.pointerUp(root, {
      clientX: 100,
      clientY: 120,
      bubbles: true,
      pointerId: 1,
      pointerType: 'touch',
    });

    expect(viewport).not.toHaveAttribute('data-expanded');
  });

  it('keeps expanded when a touch swipe is canceled without leaving the viewport', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport data-testid="viewport">
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });
    await user.click(button);

    const root = await screen.findByTestId('root');
    const viewport = screen.getByTestId('viewport');

    Object.defineProperty(root, 'setPointerCapture', {
      value: () => {},
      configurable: true,
    });

    fireEvent.pointerDown(root, {
      clientX: 100,
      clientY: 100,
      button: 0,
      bubbles: true,
      pointerId: 1,
      pointerType: 'touch',
    });
    fireEvent.pointerMove(root, {
      clientX: 100,
      clientY: 120,
      bubbles: true,
      pointerId: 1,
      pointerType: 'touch',
    });

    expect(root).toHaveAttribute('data-swiping');
    expect(viewport).toHaveAttribute('data-expanded');

    fireEvent.pointerCancel(root, {
      clientX: 100,
      clientY: 120,
      bubbles: true,
      pointerId: 1,
      pointerType: 'touch',
    });

    expect(root).not.toHaveAttribute('data-swiping');
    expect(viewport).toHaveAttribute('data-expanded');
  });

  it('collapses after a touch swipe is canceled if mouseleave already fired', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport data-testid="viewport">
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    const button = screen.getByRole('button', { name: 'add' });
    await user.click(button);

    const root = await screen.findByTestId('root');
    const viewport = screen.getByTestId('viewport');

    Object.defineProperty(root, 'setPointerCapture', {
      value: () => {},
      configurable: true,
    });

    fireEvent.pointerDown(root, {
      clientX: 100,
      clientY: 100,
      button: 0,
      bubbles: true,
      pointerId: 1,
      pointerType: 'touch',
    });
    fireEvent.pointerMove(root, {
      clientX: 100,
      clientY: 120,
      bubbles: true,
      pointerId: 1,
      pointerType: 'touch',
    });

    fireEvent.mouseLeave(viewport);
    fireEvent.pointerCancel(root, {
      clientX: 100,
      clientY: 120,
      bubbles: true,
      pointerId: 1,
      pointerType: 'touch',
    });

    expect(root).not.toHaveAttribute('data-swiping');
    expect(viewport).not.toHaveAttribute('data-expanded');
  });

  describe('timers', () => {
    const { render: renderFakeTimers, clock } = createRenderer();

    clock.withFakeTimers();

    it('pauses timers when hovering', async () => {
      await renderFakeTimers(
        <Toast.Provider>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });

      fireEvent.click(button);
      fireEvent.mouseEnter(screen.getByTestId('root'));

      clock.tick(5001);

      expect(screen.queryByTestId('root')).not.toBe(null);
    });

    it('resumes timers when not hovering', async () => {
      await renderFakeTimers(
        <Toast.Provider>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });

      fireEvent.click(button);
      fireEvent.mouseEnter(screen.getByTestId('root'));

      clock.tick(5000);

      fireEvent.mouseLeave(screen.getByTestId('root'));

      clock.tick(4999);

      expect(screen.queryByTestId('root')).not.toBe(null);

      clock.tick(2);

      expect(screen.queryByTestId('root')).toBe(null);
    });

    it('pauses timers when the viewport is focused', async () => {
      await renderFakeTimers(
        <Toast.Provider>
          <Toast.Viewport data-testid="viewport">
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });

      fireEvent.click(button);
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'F6' });

      clock.tick(5001);

      expect(screen.queryByTestId('root')).not.toBe(null);
    });

    it('restores focus and resumes timers on shift+Tab out of the focused viewport', async () => {
      await renderFakeTimers(
        <Toast.Provider>
          <Toast.Viewport data-testid="viewport">
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });

      await act(async () => button.focus());
      fireEvent.click(button);
      fireEvent.keyDown(button, { key: 'F6' });

      const viewport = screen.getByTestId('viewport');
      expect(viewport).toHaveFocus();

      clock.tick(5001);
      expect(screen.queryByTestId('root')).not.toBe(null);

      fireEvent.keyDown(viewport, { key: 'Tab', shiftKey: true });

      expect(button).toHaveFocus();

      clock.tick(5001);
      expect(screen.queryByTestId('root')).toBe(null);
    });

    it('keeps timers paused when shift+Tab returns focus inside the viewport', async () => {
      await renderFakeTimers(
        <Toast.Provider>
          <Toast.Viewport data-testid="viewport">
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });

      await act(async () => button.focus());
      fireEvent.click(button);

      // Pressing F6 from a control inside the toast makes the restore target
      // itself live inside the viewport.
      const close = document.querySelector('[aria-label="close-press"]') as HTMLElement;
      await act(async () => close.focus());
      fireEvent.keyDown(close, { key: 'F6' });

      const viewport = screen.getByTestId('viewport');
      expect(viewport).toHaveFocus();

      fireEvent.keyDown(viewport, { key: 'Tab', shiftKey: true });

      expect(close).toHaveFocus();

      clock.tick(5001);
      // Focus never left the viewport, so the toast must stay put.
      expect(screen.queryByTestId('root')).not.toBe(null);
    });

    it('keeps the viewport focused when Tab is pressed without shift', async () => {
      await renderFakeTimers(
        <Toast.Provider>
          <Toast.Viewport data-testid="viewport">
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });

      await act(async () => button.focus());
      fireEvent.click(button);
      fireEvent.keyDown(button, { key: 'F6' });

      const viewport = screen.getByTestId('viewport');
      fireEvent.keyDown(viewport, { key: 'Tab' });

      // Forward Tab moves into the toasts, so the viewport must not hand focus back.
      expect(button).not.toHaveFocus();

      clock.tick(5001);
      expect(screen.queryByTestId('root')).not.toBe(null);
    });

    it('collapses and resumes timers on a touch outside the viewport', async () => {
      await renderFakeTimers(
        <Toast.Provider>
          <Toast.Viewport data-testid="viewport">
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });

      fireEvent.click(button);
      fireEvent.mouseEnter(screen.getByTestId('root'));

      const viewport = screen.getByTestId('viewport');
      expect(viewport).toHaveAttribute('data-expanded');

      clock.tick(5001);
      expect(screen.queryByTestId('root')).not.toBe(null);

      fireEvent.pointerDown(document.body, { pointerType: 'touch' });

      expect(viewport).not.toHaveAttribute('data-expanded');

      clock.tick(5001);
      expect(screen.queryByTestId('root')).toBe(null);
    });

    it('stays expanded on a touch inside the viewport', async () => {
      await renderFakeTimers(
        <Toast.Provider>
          <Toast.Viewport data-testid="viewport">
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });

      fireEvent.click(button);
      fireEvent.mouseEnter(screen.getByTestId('root'));

      const viewport = screen.getByTestId('viewport');
      fireEvent.pointerDown(viewport, { pointerType: 'touch' });

      expect(viewport).toHaveAttribute('data-expanded');

      clock.tick(5001);
      expect(screen.queryByTestId('root')).not.toBe(null);
    });

    it('ignores a mouse pointerdown outside the viewport', async () => {
      await renderFakeTimers(
        <Toast.Provider>
          <Toast.Viewport data-testid="viewport">
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });

      fireEvent.click(button);
      fireEvent.mouseEnter(screen.getByTestId('root'));

      // Only touch activity ends the paused interaction; a mouse press outside
      // is followed by a `mouseleave`, which handles the collapse instead.
      fireEvent.pointerDown(document.body, { pointerType: 'mouse' });

      expect(screen.getByTestId('viewport')).toHaveAttribute('data-expanded');

      clock.tick(5001);
      expect(screen.queryByTestId('root')).not.toBe(null);
    });

    it.skipIf(!isJSDOM)('resumes timers when the viewport is blurred', async () => {
      await renderFakeTimers(
        <Toast.Provider>
          <Toast.Viewport data-testid="viewport">
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });

      fireEvent.click(button);
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'F6' });

      clock.tick(5001);

      await act(async () => button.focus());

      clock.tick(5001);

      expect(screen.queryByTestId('root')).toBe(null);
    });

    it.skipIf(!isJSDOM)('resumes timers when the window regains focus', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      await renderFakeTimers(
        <Toast.Provider>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });

      fireEvent.click(button);

      expect(screen.queryByTestId('root')).not.toBe(null);
      const blurListener = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'blur' && call[2] === true,
      )?.[1] as EventListener | undefined;
      const focusListener = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'focus' && call[2] === true,
      )?.[1] as EventListener | undefined;

      addEventListenerSpy.mockRestore();

      expect(blurListener).toBeDefined();
      expect(focusListener).toBeDefined();

      if (!blurListener || !focusListener) {
        throw new Error('Expected window focus and blur listeners to be registered.');
      }

      const blurEvent = new FocusEvent('blur');
      Object.defineProperty(blurEvent, 'composedPath', {
        value: () => [window],
      });

      const focusEvent = new FocusEvent('focus');
      Object.defineProperty(focusEvent, 'composedPath', {
        value: () => [window],
      });

      clock.tick(1000);

      await act(async () => {
        blurListener(blurEvent);
      });

      clock.tick(5000);

      expect(screen.queryByTestId('root')).not.toBe(null);

      await act(async () => {
        focusListener(focusEvent);
      });

      clock.tick(3999);

      expect(screen.queryByTestId('root')).not.toBe(null);

      clock.tick(2);

      expect(screen.queryByTestId('root')).toBe(null);
    });

    it.skipIf(!isJSDOM)(
      'keeps timers paused on mouseleave while the window is blurred',
      async () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

        await renderFakeTimers(
          <Toast.Provider>
            <Toast.Viewport>
              <List />
            </Toast.Viewport>
            <Button />
          </Toast.Provider>,
        );

        const button = screen.getByRole('button', { name: 'add' });
        fireEvent.click(button);

        const root = screen.getByTestId('root');

        const blurListener = addEventListenerSpy.mock.calls.find(
          (call) => call[0] === 'blur' && call[2] === true,
        )?.[1] as EventListener | undefined;
        addEventListenerSpy.mockRestore();

        if (!blurListener) {
          throw new Error('Expected window blur listener to be registered.');
        }

        const blurEvent = new FocusEvent('blur');
        Object.defineProperty(blurEvent, 'composedPath', { value: () => [window] });

        // Hovering pauses the timer.
        fireEvent.mouseEnter(root);
        clock.tick(1000);

        // The window loses focus while still hovering.
        await act(async () => {
          blurListener(blurEvent);
        });

        // Leaving with the pointer must not resume the timer while the window is
        // blurred, otherwise the toast could expire off-screen.
        fireEvent.mouseLeave(root);
        clock.tick(10000);

        expect(screen.queryByTestId('root')).not.toBe(null);
      },
    );

    it.skipIf(!isJSDOM)(
      'keeps timers paused on viewport blur while the window is blurred',
      async () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

        await renderFakeTimers(
          <Toast.Provider>
            <Toast.Viewport data-testid="viewport">
              <List />
            </Toast.Viewport>
            <Button />
          </Toast.Provider>,
        );

        const button = screen.getByRole('button', { name: 'add' });
        fireEvent.click(button);

        const blurListener = addEventListenerSpy.mock.calls.find(
          (call) => call[0] === 'blur' && call[2] === true,
        )?.[1] as EventListener | undefined;
        addEventListenerSpy.mockRestore();

        if (!blurListener) {
          throw new Error('Expected window blur listener to be registered.');
        }

        fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'F6' });
        expect(screen.getByTestId('viewport')).toHaveFocus();

        clock.tick(1000);

        const blurEvent = new FocusEvent('blur');
        Object.defineProperty(blurEvent, 'composedPath', { value: () => [window] });

        await act(async () => {
          blurListener(blurEvent);
        });

        await act(async () => button.focus());

        clock.tick(10000);

        expect(screen.queryByTestId('root')).not.toBe(null);
      },
    );

    it.skipIf(!isJSDOM)(
      'collapses a deferred mouseleave after a closing toast is removed while blurred',
      async () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        const animationsDisabled = globalThis.BASE_UI_ANIMATIONS_DISABLED;
        globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

        try {
          function CloseNewestButton() {
            const { close, toasts } = Toast.useToastManager();

            return (
              <button
                onClick={() => {
                  close(toasts[0]?.id);
                }}
              >
                close newest
              </button>
            );
          }

          await renderFakeTimers(
            <Toast.Provider>
              <Toast.Viewport data-testid="viewport">
                <List />
              </Toast.Viewport>
              <Button />
              <CloseNewestButton />
            </Toast.Provider>,
          );

          const button = screen.getByRole('button', { name: 'add' });
          fireEvent.click(button);
          fireEvent.click(button);

          const viewport = screen.getByTestId('viewport');
          const newestRoot = screen.getAllByTestId('root')[0];
          let finishAnimation!: () => void;
          const animationFinished = new Promise<void>((resolve) => {
            finishAnimation = resolve;
          });

          Object.defineProperty(newestRoot, 'getAnimations', {
            value: () => [{ finished: animationFinished }],
            configurable: true,
          });

          fireEvent.mouseEnter(viewport);
          expect(viewport).toHaveAttribute('data-expanded');

          fireEvent.click(screen.getByRole('button', { name: 'close newest' }));
          expect(newestRoot).toHaveAttribute('data-ending-style');

          const blurListener = addEventListenerSpy.mock.calls.find(
            (call) => call[0] === 'blur' && call[2] === true,
          )?.[1] as EventListener | undefined;

          if (!blurListener) {
            throw new Error('Expected window blur listener to be registered.');
          }

          const blurEvent = new FocusEvent('blur');
          Object.defineProperty(blurEvent, 'composedPath', { value: () => [window] });

          fireEvent.mouseLeave(viewport);

          await act(async () => {
            blurListener(blurEvent);
          });

          await act(async () => {
            clock.tick(20);
            finishAnimation();
            await Promise.resolve();
          });

          expect(screen.queryAllByTestId('root')).toHaveLength(1);
          expect(viewport).not.toHaveAttribute('data-expanded');
        } finally {
          addEventListenerSpy.mockRestore();
          globalThis.BASE_UI_ANIMATIONS_DISABLED = animationsDisabled;
        }
      },
    );
  });

  describe('focus management', () => {
    const { render: renderFakeTimers, clock } = createRenderer();

    clock.withFakeTimers();

    it.skipIf(!isJSDOM)('skips toasts animating out when tabbing into the viewport', async () => {
      await renderFakeTimers(
        <Toast.Provider>
          <Toast.Viewport data-testid="viewport">
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });
      fireEvent.click(button); // oldest toast
      fireEvent.click(button); // newest toast (toasts[0])

      const roots = screen.getAllByTestId('root');
      const newest = roots[0];
      const survivor = roots[1];

      // Close the newest toast. It enters the `ending` state and stays mounted
      // because the exit animation hasn't completed (no clock tick). The close
      // button is `aria-hidden` until expanded, so query it by attribute.
      const newestCloseButton = document.querySelectorAll(
        '[aria-label="close-press"]',
      )[0] as HTMLElement;
      fireEvent.click(newestCloseButton);

      // F6 focuses the viewport and renders the focus guards.
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'F6' });

      const viewport = screen.getByTestId('viewport');
      const guard = document.querySelector('[data-base-ui-focus-guard]') as HTMLElement;
      fireEvent.focus(guard, { relatedTarget: viewport });

      expect(survivor).toHaveFocus();
      expect(newest).not.toHaveFocus();
    });

    it.skipIf(!isJSDOM)('returns focus when no toast can receive focus', async () => {
      await renderFakeTimers(
        <Toast.Provider limit={0}>
          <Toast.Viewport data-testid="viewport">
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });
      await act(async () => button.focus());
      fireEvent.click(button);

      fireEvent.keyDown(button, { key: 'F6' });

      const viewport = screen.getByTestId('viewport');
      expect(viewport).toHaveFocus();

      const guard = document.querySelector('[data-base-ui-focus-guard]') as HTMLElement;
      fireEvent.focus(guard, { relatedTarget: viewport });

      expect(button).toHaveFocus();
    });

    it.skipIf(!isJSDOM)('returns focus to the trigger when every toast is closed', async () => {
      const manager = Toast.createToastManager();

      await renderFakeTimers(
        <Toast.Provider toastManager={manager} timeout={0}>
          <Toast.Viewport data-testid="viewport">
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });
      await act(async () => button.focus());
      fireEvent.click(button);

      fireEvent.keyDown(button, { key: 'F6' });
      const viewport = screen.getByTestId('viewport');
      const guard = document.querySelector('[data-base-ui-focus-guard]') as HTMLElement;
      fireEvent.focus(guard, { relatedTarget: viewport });

      expect(screen.getByTestId('root')).toHaveFocus();

      // Closing everything leaves no toast to hand focus to.
      await act(async () => manager.close());

      expect(button).toHaveFocus();
    });

    it.skipIf(!isJSDOM)('moves focus past toasts animating out when one is closed', async () => {
      const manager = Toast.createToastManager();

      await renderFakeTimers(
        <Toast.Provider toastManager={manager} timeout={0}>
          <Toast.Viewport data-testid="viewport">
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });
      await act(async () => button.focus());

      await act(async () => {
        manager.add({ title: 'oldest' });
      });
      await act(async () => {
        manager.add({ id: 'middle', title: 'middle' });
      });
      await act(async () => {
        manager.add({ id: 'newest', title: 'newest' });
      });

      const [newest, middle, oldest] = screen.getAllByTestId('root');
      expect(middle).toHaveTextContent('middle');

      fireEvent.keyDown(button, { key: 'F6' });
      const viewport = screen.getByTestId('viewport');
      const guard = document.querySelector('[data-base-ui-focus-guard]') as HTMLElement;
      fireEvent.focus(guard, { relatedTarget: viewport });

      expect(newest).toHaveFocus();

      // Dismissing both in one go leaves the middle toast animating out while
      // the focused toast closes, so focus has to skip over it.
      await act(async () => {
        manager.close('middle');
        manager.close('newest');
      });

      expect(middle).toHaveAttribute('data-ending-style');
      expect(oldest).toHaveFocus();
    });

    it.skipIf(!isJSDOM)('leaves focus alone when it is outside the viewport', async () => {
      const manager = Toast.createToastManager();

      await renderFakeTimers(
        <Toast.Provider toastManager={manager} timeout={0}>
          <Toast.Viewport data-testid="viewport">
            <List />
          </Toast.Viewport>
          <Button />
        </Toast.Provider>,
      );

      const button = screen.getByRole('button', { name: 'add' });
      await act(async () => button.focus());
      fireEvent.click(button);
      fireEvent.click(button);

      // Focus never entered the viewport, so closing a toast must not steal it.
      await act(async () => manager.close());

      expect(button).toHaveFocus();
    });
  });
});
