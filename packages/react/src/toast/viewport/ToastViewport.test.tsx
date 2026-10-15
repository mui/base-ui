import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import type { UserEvent } from '@testing-library/user-event';
import { Toast } from '@base-ui/react/toast';
import { inertValue } from '@base-ui/utils/inertValue';
import {
  createRenderer,
  describeConformance,
  isJSDOM,
  resetBrowserPointer,
  wait,
} from '#test-utils';
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

  it.skipIf(isJSDOM)('sets the measured frontmost toast height CSS variable', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport data-testid="viewport">
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'add' }));

    await waitFor(() =>
      expect(
        screen.getByTestId('viewport').style.getPropertyValue('--toast-frontmost-height'),
      ).not.toBe(''),
    );
  });

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
      const liveWindowListeners = (type: string) =>
        addWindowListener.mock.calls.filter((call) => call[0] === type).length -
        removeWindowListener.mock.calls.filter((call) => call[0] === type).length;

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
        expect(liveWindowListeners('blur')).toBe(1);
        expect(liveWindowListeners('focus')).toBe(1);
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
        // Window focus tracking stays attached while the viewport is empty.
        expect(liveWindowListeners('blur')).toBe(1);
        expect(liveWindowListeners('focus')).toBe(1);
        expect(
          removeDocumentListener.mock.calls.filter(([type]) => type === 'pointerdown'),
        ).toHaveLength(1);

        await user.click(add);
        await waitFor(() =>
          expect(iframeDocument.querySelector('[data-testid="root"]')).not.toBe(null),
        );
        expect(addWindowListener.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(2);
        expect(liveWindowListeners('blur')).toBe(1);
        expect(liveWindowListeners('focus')).toBe(1);
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

  it('returns focus to previous element when F6 is pressed from inside the viewport', async () => {
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
    await user.tab();
    expect(screen.getByTestId('root')).toHaveFocus();

    await user.keyboard('{F6}');

    expect(button).toHaveFocus();
  });

  it('keeps focus where the viewport moves it on F6 and returns it to the F6 origin', async () => {
    const manager = Toast.createToastManager();
    const otherManager = Toast.createToastManager();
    const { user } = await render(
      <React.Fragment>
        <button type="button">origin</button>
        <button type="button">other</button>
        <Toast.Provider toastManager={manager}>
          <Toast.Viewport
            onFocus={(event) => {
              if (event.target === event.currentTarget) {
                event.currentTarget.querySelector<HTMLElement>('[data-testid="root"]')?.focus();
              }
            }}
          >
            <List />
          </Toast.Viewport>
        </Toast.Provider>
        <Toast.Provider toastManager={otherManager}>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
        </Toast.Provider>
      </React.Fragment>,
    );

    await act(async () => {
      manager.add({ title: 'title' });
    });
    // The other viewport's F6 listener is registered second, so it only acts if the first
    // listener leaves the press unhandled.
    await act(async () => {
      otherManager.add({ title: 'other' });
    });

    const origin = screen.getByRole('button', { name: 'origin' });
    await act(async () => origin.focus());

    await user.keyboard('{F6}');
    expect(screen.getAllByTestId('root')[0]).toHaveFocus();

    await user.tab({ shift: true });

    expect(origin).toHaveFocus();
  });

  it('returns focus to the F6 origin when focusing the viewport closes the last toast', async () => {
    const manager = Toast.createToastManager();
    const otherManager = Toast.createToastManager();
    const { user } = await render(
      <React.Fragment>
        <button type="button">origin</button>
        <Toast.Provider toastManager={manager}>
          <Toast.Viewport data-testid="viewport" onFocus={() => manager.close()}>
            <List />
          </Toast.Viewport>
        </Toast.Provider>
        <Toast.Provider toastManager={otherManager}>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
        </Toast.Provider>
      </React.Fragment>,
    );

    await act(async () => {
      manager.add({ title: 'title' });
    });
    // The other viewport's F6 listener is registered second, so it only acts if the first
    // listener leaves the press unhandled.
    await act(async () => {
      otherManager.add({ title: 'other' });
    });

    const origin = screen.getByRole('button', { name: 'origin' });
    await act(async () => origin.focus());

    await user.keyboard('{F6}');

    expect(origin).toHaveFocus();
  });

  it('keeps focus on the previous element while F6 is held from inside the viewport', async () => {
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

    await user.keyboard('{F6>2}');

    expect(button).toHaveFocus();
  });

  it('does not restore focus on an F6 press prevented by the consumer', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport data-testid="viewport" onKeyDown={(event) => event.preventDefault()}>
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );
    await user.click(screen.getByRole('button', { name: 'add' }));
    await user.keyboard('{F6}');
    const viewport = screen.getByTestId('viewport');
    expect(viewport).toHaveFocus();

    await user.keyboard('{F6}');

    expect(viewport).toHaveFocus();
  });

  it('leaves F6 to the browser when the viewport was entered without F6', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport data-testid="viewport">
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'add' }));

    const root = screen.getByTestId('root');
    await act(async () => root.focus());

    expect(fireEvent.keyDown(root, { key: 'F6' })).toBe(true);
    expect(root).toHaveFocus();
  });

  it('leaves F6 to the browser when the viewport was entered without F6 after an earlier F6 visit', async () => {
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
    await user.tab({ shift: true });
    expect(button).toHaveFocus();

    const root = screen.getByTestId('root');
    await act(async () => root.focus());

    expect(fireEvent.keyDown(root, { key: 'F6' })).toBe(true);
    expect(root).toHaveFocus();
  });

  it('leaves F6 to the browser when the element focused before F6 was removed', async ({
    onTestFinished,
  }) => {
    const manager = Toast.createToastManager();
    const { user } = await render(
      <Toast.Provider toastManager={manager}>
        <Toast.Viewport data-testid="viewport">
          <List />
        </Toast.Viewport>
      </Toast.Provider>,
    );

    await act(async () => {
      manager.add({ title: 'title' });
    });

    const origin = document.createElement('button');
    document.body.appendChild(origin);
    onTestFinished(() => origin.remove());
    await act(async () => origin.focus());

    await user.keyboard('{F6}');
    expect(screen.getByTestId('viewport')).toHaveFocus();
    origin.remove();

    expect(fireEvent.keyDown(screen.getByTestId('viewport'), { key: 'F6' })).toBe(true);
    expect(screen.getByTestId('viewport')).toHaveFocus();
  });

  it('skips a viewport inside an inert container when F6 is pressed with two providers', async () => {
    const inertManager = Toast.createToastManager();
    const usableManager = Toast.createToastManager();
    const { user } = await render(
      <React.Fragment>
        <button type="button">page</button>
        <div inert={inertValue(true)}>
          <Toast.Provider toastManager={inertManager}>
            <Toast.Viewport>
              <List />
            </Toast.Viewport>
          </Toast.Provider>
        </div>
        <Toast.Provider toastManager={usableManager}>
          <Toast.Viewport data-testid="usable-viewport">
            <List />
          </Toast.Viewport>
        </Toast.Provider>
      </React.Fragment>,
    );

    await act(async () => {
      inertManager.add({ title: 'inert' });
    });
    await act(async () => {
      usableManager.add({ title: 'usable' });
    });

    const button = screen.getByRole('button', { name: 'page' });
    await act(async () => button.focus());

    await user.keyboard('{F6}');

    expect(screen.getByTestId('usable-viewport')).toHaveFocus();
  });

  it('ignores F6 while the viewport is empty', async () => {
    await render(
      <React.Fragment>
        <button type="button">page</button>
        <Toast.Provider>
          <Toast.Viewport>
            <List />
          </Toast.Viewport>
        </Toast.Provider>
      </React.Fragment>,
    );

    const button = screen.getByRole('button', { name: 'page' });
    await act(async () => button.focus());

    expect(fireEvent.keyDown(button, { key: 'F6' })).toBe(true);
    expect(button).toHaveFocus();
  });

  it.each([
    { name: 'with an F6 origin', enterWithF6: true },
    { name: 'without an F6 origin', enterWithF6: false },
  ])('handles F6 in the focused viewport $name before other providers', async ({ enterWithF6 }) => {
    const firstManager = Toast.createToastManager();
    const secondManager = Toast.createToastManager();
    const { user } = await render(
      <React.Fragment>
        <button type="button">origin</button>
        <Toast.Provider toastManager={firstManager}>
          <Toast.Viewport data-testid="first-viewport">
            <List />
          </Toast.Viewport>
        </Toast.Provider>
        <Toast.Provider toastManager={secondManager}>
          <Toast.Viewport data-testid="second-viewport">
            <List />
          </Toast.Viewport>
        </Toast.Provider>
      </React.Fragment>,
    );
    const origin = screen.getByRole('button', { name: 'origin' });
    await act(async () => {
      firstManager.add({ title: 'first' });
    });
    await act(async () => {
      secondManager.add({ title: 'second' });
      origin.focus();
    });
    const firstViewport = screen.getByTestId('first-viewport');
    const secondViewport = screen.getByTestId('second-viewport');
    // Keep the first listener registered while F6 enters the second viewport.
    firstViewport.setAttribute('inert', '');
    if (enterWithF6) {
      await user.keyboard('{F6}');
    } else {
      await act(async () => secondViewport.focus());
    }
    expect(secondViewport).toHaveFocus();
    firstViewport.removeAttribute('inert');

    expect(fireEvent.keyDown(secondViewport, { key: 'F6' })).toBe(!enterWithF6);
    expect(enterWithF6 ? origin : secondViewport).toHaveFocus();
  });

  it('returns focus to the body on F6 when nothing had focus before entering', async () => {
    const manager = Toast.createToastManager();
    const { user } = await render(
      <Toast.Provider toastManager={manager}>
        <Toast.Viewport data-testid="viewport">
          <List />
        </Toast.Viewport>
      </Toast.Provider>,
    );

    await act(async () => {
      manager.add({ title: 'title' });
    });
    expect(document.activeElement).toBe(document.body);

    await user.keyboard('{F6}');
    await user.tab();
    expect(screen.getByTestId('root')).toHaveFocus();

    await user.keyboard('{F6}');

    expect(document.activeElement).toBe(document.body);
  });

  it('leaves shift+Tab to the browser on a viewport focused without F6 after an earlier F6 visit', async () => {
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
    await user.tab({ shift: true });
    expect(button).toHaveFocus();

    const viewport = screen.getByTestId('viewport');
    await act(async () => viewport.focus());

    expect(fireEvent.keyDown(viewport, { key: 'Tab', shiftKey: true })).toBe(true);
  });

  it('keeps the viewport focused while F6 is held', async () => {
    const { user } = await render(
      <Toast.Provider>
        <Toast.Viewport data-testid="viewport">
          <List />
        </Toast.Viewport>
        <Button />
      </Toast.Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'add' }));
    await user.keyboard('{F6>2}');

    expect(screen.getByTestId('viewport')).toHaveFocus();
  });

  it.each([
    { name: 'F6', exit: (user: UserEvent) => user.keyboard('{F6}') },
    { name: 'shift+Tab', exit: (user: UserEvent) => user.tab({ shift: true }) },
  ])('returns focus to the page on $name after F6 with two providers', async ({ exit }) => {
    const firstManager = Toast.createToastManager();
    const secondManager = Toast.createToastManager();
    const { user } = await render(
      <React.Fragment>
        <Toast.Provider toastManager={firstManager}>
          <Toast.Viewport data-testid="first-viewport">
            <List />
          </Toast.Viewport>
        </Toast.Provider>
        <Toast.Provider toastManager={secondManager}>
          <Toast.Viewport data-testid="second-viewport">
            <List />
          </Toast.Viewport>
        </Toast.Provider>
        <button type="button">page</button>
      </React.Fragment>,
    );

    await act(async () => {
      firstManager.add({ title: 'first' });
      secondManager.add({ title: 'second' });
    });

    const button = screen.getByRole('button', { name: 'page' });
    await act(async () => button.focus());

    await user.keyboard('{F6}');
    expect([screen.getByTestId('first-viewport'), screen.getByTestId('second-viewport')]).toContain(
      document.activeElement,
    );

    await exit(user);

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

    function dispatchWindowEvent(type: 'blur' | 'focus') {
      const event = new FocusEvent(type);
      // jsdom reports an empty `composedPath()` for events dispatched on the window.
      Object.defineProperty(event, 'composedPath', { value: () => [window] });
      window.dispatchEvent(event);
    }

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

    it('runs timers when onFocus redirects focus outside the viewport', async () => {
      const manager = Toast.createToastManager();
      const originRef = React.createRef<HTMLButtonElement>();
      await renderFakeTimers(
        <Toast.Provider toastManager={manager}>
          <button ref={originRef} type="button">
            origin
          </button>
          <Toast.Viewport data-testid="viewport" onFocus={() => originRef.current?.focus()}>
            <List />
          </Toast.Viewport>
        </Toast.Provider>,
      );

      await act(async () => {
        manager.add({ title: 'title' });
        originRef.current?.focus();
      });
      expect(originRef.current).toHaveFocus();
      expect(screen.getByTestId('root')).toBeInTheDocument();

      fireEvent.keyDown(screen.getByRole('button', { name: 'origin' }), { key: 'F6' });

      expect(originRef.current).toHaveFocus();
      expect(screen.getByTestId('viewport')).not.toHaveAttribute('data-expanded');
      clock.tick(5001);
      expect(screen.queryByTestId('root')).not.toBeInTheDocument();
    });

    it('runs new toast timers after onFocus closes the last toast', async () => {
      const manager = Toast.createToastManager();
      await renderFakeTimers(
        <Toast.Provider toastManager={manager}>
          <button type="button">origin</button>
          <Toast.Viewport data-testid="viewport" onFocus={() => manager.close()}>
            <List />
          </Toast.Viewport>
        </Toast.Provider>,
      );

      const origin = screen.getByRole('button', { name: 'origin' });
      await act(async () => {
        manager.add({ title: 'first' });
        origin.focus();
      });
      expect(origin).toHaveFocus();
      expect(screen.getByTestId('root')).toBeInTheDocument();

      fireEvent.keyDown(screen.getByRole('button', { name: 'origin' }), { key: 'F6' });
      clock.tick(100);
      expect(origin).toHaveFocus();
      expect(screen.queryByTestId('root')).not.toBeInTheDocument();

      await act(async () => {
        manager.add({ title: 'second' });
      });
      const viewport = screen.getByTestId('viewport');
      expect(viewport).not.toHaveAttribute('data-expanded');
      fireEvent.mouseEnter(viewport);
      expect(viewport).toHaveAttribute('data-expanded');
      clock.tick(5001);
      expect(screen.getByTestId('root')).toBeInTheDocument();

      fireEvent.mouseLeave(viewport);
      clock.tick(5001);
      expect(screen.queryByTestId('root')).not.toBeInTheDocument();
    });

    it.each(['hovering', 'focused'] as const)(
      'keeps timers paused while still %s after the other interaction ends',
      async (remainingInteraction) => {
        await renderFakeTimers(
          <Toast.Provider>
            <Toast.Viewport data-testid="viewport">
              <List />
            </Toast.Viewport>
            <Button />
          </Toast.Provider>,
        );

        const addButton = screen.getByRole('button', { name: 'add' });
        await act(async () => addButton.focus());
        fireEvent.click(addButton);
        clock.tick(1000);

        fireEvent.keyDown(addButton, { key: 'F6' });

        const action = screen.getByRole('button', { name: 'action' });
        const viewport = screen.getByTestId('viewport');
        await act(async () => action.focus());
        expect(action).toHaveFocus();
        fireEvent.mouseEnter(viewport);

        if (remainingInteraction === 'hovering') {
          await act(async () => addButton.focus());
        } else {
          fireEvent.mouseLeave(viewport);
        }
        expect(remainingInteraction === 'hovering' ? addButton : action).toHaveFocus();

        clock.tick(5001);
        expect(screen.getByTestId('root')).toBeInTheDocument();

        if (remainingInteraction === 'hovering') {
          fireEvent.mouseLeave(viewport);
        } else {
          await act(async () => addButton.focus());
        }
        expect(addButton).toHaveFocus();

        clock.tick(3999);
        expect(screen.getByTestId('root')).toBeInTheDocument();

        clock.tick(2);
        expect(screen.queryByTestId('root')).not.toBeInTheDocument();
      },
    );

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

    it('keeps a toast added while the window is blurred paused until the window regains focus', async () => {
      const manager = Toast.createToastManager();

      await renderFakeTimers(
        <Toast.Provider toastManager={manager}>
          <Toast.Portal>
            <Toast.Viewport>
              <List />
            </Toast.Viewport>
          </Toast.Portal>
        </Toast.Provider>,
      );

      await act(async () => {
        dispatchWindowEvent('blur');
      });
      await act(async () => {
        manager.add({ title: 'title' });
      });

      clock.tick(5001);
      expect(screen.getByTestId('root')).toBeInTheDocument();

      await act(async () => {
        dispatchWindowEvent('focus');
      });
      clock.tick(5001);

      expect(screen.queryByTestId('root')).toBe(null);
    });

    it('runs the timer of a toast added after the window regained focus while empty', async () => {
      const manager = Toast.createToastManager();

      await renderFakeTimers(
        <Toast.Provider toastManager={manager}>
          <Toast.Portal>
            <Toast.Viewport>
              <List />
            </Toast.Viewport>
          </Toast.Portal>
        </Toast.Provider>,
      );

      await act(async () => {
        manager.add({ id: 'manual', title: 'manual', timeout: 0 });
      });
      await act(async () => {
        dispatchWindowEvent('blur');
      });
      await act(async () => {
        manager.close('manual');
      });
      await act(async () => {
        clock.tick(100);
      });
      expect(screen.queryByTestId('root')).toBe(null);

      await act(async () => {
        dispatchWindowEvent('focus');
        clock.tick(1);
      });
      await act(async () => {
        manager.add({ title: 'title' });
      });
      clock.tick(5001);

      expect(screen.queryByTestId('root')).toBe(null);
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

  describe.skipIf(isJSDOM)('real browser input', () => {
    function TitleList() {
      return Toast.useToastManager().toasts.map((toast) => (
        <Toast.Root key={toast.id} toast={toast} data-testid={toast.id}>
          <Toast.Title data-testid={`${toast.id}-title`} />
        </Toast.Root>
      ));
    }

    it('returns focus to the origin when onClose adds an unmounted replacement toast', async () => {
      const { userEvent } = await import('vitest/browser');
      const manager = Toast.createToastManager();
      await render(
        <Toast.Provider toastManager={manager} timeout={0}>
          <button type="button">origin</button>
          <Toast.Viewport data-testid="viewport">
            <TitleList />
          </Toast.Viewport>
        </Toast.Provider>,
      );
      const origin = screen.getByRole('button', { name: 'origin' });
      await act(async () => {
        manager.add({
          id: 'first',
          title: 'first',
          onClose: () => manager.add({ id: 'replacement', title: 'replacement' }),
        });
        origin.focus();
      });
      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        await userEvent.keyboard('{F6}{Tab}');
      });
      expect(screen.getByTestId('first')).toHaveFocus();
      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        await userEvent.keyboard('{Escape}');
      });
      expect(await screen.findByTestId('replacement')).toBeInTheDocument();
      expect(screen.queryByTestId('first')).not.toBeInTheDocument();
      expect(origin).toHaveFocus();
    });

    it.each([
      {
        name: 'hidden',
        disable: (element: HTMLButtonElement) => {
          element.hidden = true;
        },
      },
      {
        name: 'disabled',
        disable: (element: HTMLButtonElement) => {
          element.disabled = true;
        },
      },
      {
        name: 'inert',
        disable: (element: HTMLButtonElement) => {
          element.inert = true;
        },
      },
    ])('leaves F6 to the browser when its origin becomes $name', async ({ disable }) => {
      const manager = Toast.createToastManager();
      const { user } = await render(
        <Toast.Provider toastManager={manager}>
          <button type="button">origin</button>
          <Toast.Viewport data-testid="viewport">
            <List />
          </Toast.Viewport>
        </Toast.Provider>,
      );
      const origin = screen.getByRole<HTMLButtonElement>('button', { name: 'origin' });
      await act(async () => {
        manager.add({ title: 'title' });
        origin.focus();
      });
      await user.keyboard('{F6}');
      const viewport = screen.getByTestId('viewport');
      expect(viewport).toHaveFocus();
      disable(origin);

      expect(fireEvent.keyDown(viewport, { key: 'F6' })).toBe(true);
    });

    it('keeps timers paused when a hovered toast is clicked while nothing had focus', async ({
      onTestFinished,
    }) => {
      const { userEvent } = await import('vitest/browser');
      onTestFinished(resetBrowserPointer);
      const manager = Toast.createToastManager();

      await render(
        <Toast.Provider toastManager={manager} timeout={300}>
          <Toast.Viewport>
            <TitleList />
          </Toast.Viewport>
        </Toast.Provider>,
      );

      await act(async () => {
        manager.add({ id: 'toast', title: 'title' });
      });
      expect(document.activeElement).toBe(document.body);

      // Real browser input (vitest/browser) updates React state outside Testing Library's act.
      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        await userEvent.click(screen.getByTestId('toast-title'));
      });
      expect(screen.getByTestId('toast')).toHaveFocus();

      await act(async () => {
        await wait(600);
      });

      expect(screen.getByTestId('toast')).toBeInTheDocument();
    });

    it('keeps timers paused when the window regains focus while a toast is hovered', async ({
      onTestFinished,
    }) => {
      const { userEvent } = await import('vitest/browser');
      onTestFinished(resetBrowserPointer);
      const manager = Toast.createToastManager();

      await render(
        <Toast.Provider toastManager={manager} timeout={300}>
          <Toast.Viewport data-testid="viewport">
            <TitleList />
          </Toast.Viewport>
        </Toast.Provider>,
      );

      await act(async () => {
        manager.add({ id: 'toast', title: 'title' });
      });

      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        await userEvent.hover(screen.getByTestId('toast'));
      });
      expect(screen.getByTestId('viewport')).toHaveAttribute('data-expanded');

      // Focusing an element in the parent frame blurs this window for real.
      const parentInput = window.parent.document.createElement('input');
      // Keep the parent layout unchanged so the pointer stays over the toast.
      parentInput.style.position = 'fixed';
      parentInput.style.left = '-1000px';
      window.parent.document.body.appendChild(parentInput);
      onTestFinished(() => parentInput.remove());

      await act(async () => {
        parentInput.focus();
        await wait(50);
      });
      expect(document.hasFocus()).toBe(false);

      await act(async () => {
        window.focus();
        await wait(50);
      });
      expect(document.hasFocus()).toBe(true);

      await act(async () => {
        await wait(600);
      });

      expect(screen.getByTestId('toast')).toBeInTheDocument();
    });

    it('moves focus to a visible toast when the next one was limited', async () => {
      const { userEvent } = await import('vitest/browser');
      const manager = Toast.createToastManager();

      await render(
        <Toast.Provider toastManager={manager} limit={2} timeout={0}>
          <Toast.Viewport data-testid="viewport">
            <TitleList />
          </Toast.Viewport>
        </Toast.Provider>,
      );

      await act(async () => {
        manager.add({ id: 'oldest', title: 'oldest' });
        manager.add({ id: 'middle', title: 'middle' });
        manager.add({ id: 'newest', title: 'newest' });
      });

      const middle = screen.getByTestId('middle');
      expect(screen.getByTestId('oldest')).toHaveAttribute('inert');

      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        await userEvent.keyboard('{F6}');
      });
      expect(screen.getByTestId('viewport')).toHaveFocus();

      await act(async () => middle.focus());
      expect(middle).toHaveFocus();
      expect(middle.matches(':focus-visible')).toBe(true);

      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        await userEvent.keyboard('{Escape}');
      });
      await waitFor(() => {
        expect(middle).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('newest')).toHaveFocus();
    });

    it('moves focus to a toast that stays open when onClose closes another', async () => {
      const { userEvent } = await import('vitest/browser');
      const manager = Toast.createToastManager();

      await render(
        <Toast.Provider toastManager={manager} timeout={0}>
          <Toast.Viewport data-testid="viewport">
            <TitleList />
          </Toast.Viewport>
        </Toast.Provider>,
      );

      await act(async () => {
        manager.add({ id: 'oldest', title: 'oldest' });
        manager.add({
          id: 'middle',
          title: 'middle',
          onClose: () => manager.close('oldest'),
        });
        manager.add({ id: 'newest', title: 'newest' });
      });

      const middle = screen.getByTestId('middle');
      const oldest = screen.getByTestId('oldest');

      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        await userEvent.keyboard('{F6}');
      });
      await act(async () => middle.focus());
      expect(middle.matches(':focus-visible')).toBe(true);

      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        await userEvent.keyboard('{Escape}');
      });
      await waitFor(() => {
        expect(middle).not.toBeInTheDocument();
      });
      await waitFor(() => {
        expect(oldest).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('newest')).toHaveFocus();
    });

    it.each([
      { name: 'the hidden attribute', props: { hidden: true } },
      { name: 'visibility: hidden', props: { style: { visibility: 'hidden' as const } } },
    ])(
      'skips a viewport hidden with $name when F6 is pressed with two providers',
      async ({ props }) => {
        const hiddenManager = Toast.createToastManager();
        const visibleManager = Toast.createToastManager();

        const { user } = await render(
          <React.Fragment>
            <button type="button">page</button>
            <Toast.Provider toastManager={hiddenManager}>
              <Toast.Viewport data-testid="hidden-viewport" {...props}>
                <TitleList />
              </Toast.Viewport>
            </Toast.Provider>
            <Toast.Provider toastManager={visibleManager}>
              <Toast.Viewport data-testid="visible-viewport">
                <TitleList />
              </Toast.Viewport>
            </Toast.Provider>
          </React.Fragment>,
        );

        await act(async () => {
          hiddenManager.add({ id: 'hidden', title: 'hidden' });
          visibleManager.add({ id: 'visible', title: 'visible' });
        });

        const button = screen.getByRole('button', { name: 'page' });
        await act(async () => button.focus());

        await user.keyboard('{F6}');
        expect(screen.getByTestId('visible-viewport')).toHaveFocus();

        await user.keyboard('{F6}');
        expect(button).toHaveFocus();
      },
    );

    it('moves focus to the next toast when the closed toast adds one in onClose', async () => {
      const { userEvent } = await import('vitest/browser');
      const manager = Toast.createToastManager();

      await render(
        <Toast.Provider toastManager={manager} timeout={0}>
          <Toast.Viewport data-testid="viewport">
            <TitleList />
          </Toast.Viewport>
        </Toast.Provider>,
      );

      await act(async () => {
        manager.add({ id: 'oldest', title: 'oldest' });
        manager.add({
          id: 'middle',
          title: 'middle',
          onClose: () => manager.add({ id: 'added', title: 'added' }),
        });
        manager.add({ id: 'newest', title: 'newest' });
      });

      const middle = screen.getByTestId('middle');

      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        await userEvent.keyboard('{F6}');
      });
      await act(async () => middle.focus());
      expect(middle.matches(':focus-visible')).toBe(true);

      // eslint-disable-next-line testing-library/no-unnecessary-act
      await act(async () => {
        await userEvent.keyboard('{Escape}');
      });
      await waitFor(() => {
        expect(middle).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('added')).toBeInTheDocument();
      expect(screen.getByTestId('oldest')).toHaveFocus();
    });
  });
});
