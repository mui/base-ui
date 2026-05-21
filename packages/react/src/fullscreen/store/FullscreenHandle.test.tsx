import { expect, vi } from 'vitest';
import * as React from 'react';
import { act, fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { Fullscreen } from '@base-ui/react/fullscreen';
import { createRenderer } from '#test-utils';
import { REASONS } from '../../internals/reasons';
import { installFullscreenApiStubs, type FullscreenApiStubs } from '../root/fullscreenApiTestUtils';

describe('Fullscreen.createHandle', () => {
  const { render } = createRenderer();
  let stubs: FullscreenApiStubs;

  beforeEach(() => {
    stubs = installFullscreenApiStubs();
  });

  afterEach(() => {
    stubs.restore();
  });

  it('returns a handle with open(), close(), and isOpen', () => {
    const handle = Fullscreen.createHandle();
    expect(typeof handle.open).toBe('function');
    expect(typeof handle.close).toBe('function');
    expect(handle.isOpen).toBe(false);
  });

  it('opens fullscreen when `handle.open()` is called from a click handler', async () => {
    const handle = Fullscreen.createHandle();
    const handleOpenChange = vi.fn();

    function App() {
      return (
        <React.Fragment>
          <button type="button" onClick={() => handle.open()}>
            Imperative open
          </button>
          <Fullscreen.Root handle={handle} onOpenChange={handleOpenChange}>
            <Fullscreen.Container data-testid="container" />
          </Fullscreen.Root>
        </React.Fragment>
      );
    }

    await render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Imperative open' }));
    await flushMicrotasks();

    expect(stubs.request).toHaveBeenCalledOnce();
    expect(handle.isOpen).toBe(true);
    expect(screen.getByTestId('container')).toHaveAttribute('data-fullscreen');
    expect(handleOpenChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ reason: REASONS.imperativeAction }),
    );
  });

  it('closes fullscreen when `handle.close()` is called', async () => {
    const handle = Fullscreen.createHandle();
    const handleOpenChange = vi.fn();

    function App() {
      return (
        <React.Fragment>
          <button type="button" onClick={() => handle.open()}>
            Imperative open
          </button>
          <button type="button" onClick={() => handle.close()}>
            Imperative close
          </button>
          <Fullscreen.Root handle={handle} onOpenChange={handleOpenChange}>
            <Fullscreen.Container data-testid="container" />
          </Fullscreen.Root>
        </React.Fragment>
      );
    }

    await render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Imperative open' }));
    await flushMicrotasks();
    expect(handle.isOpen).toBe(true);
    handleOpenChange.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Imperative close' }));
    await flushMicrotasks();

    expect(stubs.exit).toHaveBeenCalledOnce();
    expect(handle.isOpen).toBe(false);
    expect(screen.getByTestId('container')).toHaveAttribute('data-not-fullscreen');
    expect(handleOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: REASONS.imperativeAction }),
    );
  });

  it('reverts state and dispatches `reason: none` when an imperative open is rejected', async () => {
    stubs.request.mockImplementation(() => Promise.reject(new TypeError('blocked')));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handle = Fullscreen.createHandle();
    const handleOpenChange = vi.fn();

    function App() {
      return (
        <React.Fragment>
          <button type="button" onClick={() => handle.open()}>
            Imperative open
          </button>
          <Fullscreen.Root handle={handle} onOpenChange={handleOpenChange}>
            <Fullscreen.Container data-testid="container" />
          </Fullscreen.Root>
        </React.Fragment>
      );
    }

    await render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Imperative open' }));
    await flushMicrotasks();

    expect(stubs.request).toHaveBeenCalledOnce();
    expect(handleOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: REASONS.none }),
    );
    expect(handle.isOpen).toBe(false);
    expect(screen.getByTestId('container')).toHaveAttribute('data-not-fullscreen');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('`requestFullscreen()` was rejected'),
    );

    warnSpy.mockRestore();
  });

  it('reflects browser-initiated state changes (e.g. Esc) in `handle.isOpen`', async () => {
    const handle = Fullscreen.createHandle();

    function App() {
      return (
        <React.Fragment>
          <button type="button" onClick={() => handle.open()}>
            Imperative open
          </button>
          <Fullscreen.Root handle={handle}>
            <Fullscreen.Container data-testid="container" />
          </Fullscreen.Root>
        </React.Fragment>
      );
    }

    await render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Imperative open' }));
    await flushMicrotasks();
    expect(handle.isOpen).toBe(true);

    await act(async () => {
      stubs.setActiveElement(null);
      stubs.dispatchChange();
    });
    await flushMicrotasks();

    expect(handle.isOpen).toBe(false);
  });

  it('warns in development when `open(triggerId)` is given an unknown id', async () => {
    const handle = Fullscreen.createHandle();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    function App() {
      return (
        <React.Fragment>
          <button type="button" onClick={() => handle.open('does-not-exist')}>
            Imperative open
          </button>
          <Fullscreen.Root handle={handle}>
            <Fullscreen.Container />
          </Fullscreen.Root>
        </React.Fragment>
      );
    }

    await render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Imperative open' }));
    await flushMicrotasks();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No trigger found with id "does-not-exist"'),
    );

    warnSpy.mockRestore();
  });
});
