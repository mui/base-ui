import { expect, vi } from 'vitest';
import { Toast } from '@base-ui/react/toast';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { List, Button } from '../utils/test-utils';

describe('<Toast.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(<Toast.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Toast.Provider>{node}</Toast.Provider>);
    },
  }));

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
      const addEventListenerCalls = [...addEventListenerSpy.mock.calls].reverse();

      const blurListener = addEventListenerCalls.find((call) => call[0] === 'blur')?.[1] as
        | EventListener
        | undefined;
      const focusListener = addEventListenerCalls.find((call) => call[0] === 'focus')?.[1] as
        | EventListener
        | undefined;

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

        const blurListener = [...addEventListenerSpy.mock.calls]
          .reverse()
          .find((call) => call[0] === 'blur')?.[1] as EventListener | undefined;
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
  });
});
