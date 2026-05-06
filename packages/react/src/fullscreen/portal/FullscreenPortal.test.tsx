import { expect } from 'vitest';
import * as React from 'react';
import { act, fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { Fullscreen } from '@base-ui/react/fullscreen';
import { createRenderer } from '#test-utils';
import { installFullscreenApiStubs, type FullscreenApiStubs } from '../root/fullscreenApiTestUtils';

describe('<Fullscreen.Portal />', () => {
  const { render } = createRenderer();
  let stubs: FullscreenApiStubs;

  beforeEach(() => {
    stubs = installFullscreenApiStubs();
  });

  afterEach(() => {
    stubs.restore();
  });

  describe('mount lifecycle', () => {
    it('does not mount its children while closed', async () => {
      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Portal>
            <Fullscreen.Container data-testid="container" />
          </Fullscreen.Portal>
        </Fullscreen.Root>,
      );

      expect(screen.queryByTestId('container')).toBe(null);
    });

    it('mounts children and enters fullscreen when the trigger is pressed', async () => {
      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Portal>
            <Fullscreen.Container data-testid="container" />
          </Fullscreen.Portal>
        </Fullscreen.Root>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
      await flushMicrotasks();

      const container = screen.getByTestId('container');
      expect(container).toHaveAttribute('data-fullscreen');
      expect(stubs.request).toHaveBeenCalledOnce();
      expect(container.parentElement).toBe(document.body);
    });

    it('unmounts children when closed via the Close button', async () => {
      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Portal>
            <Fullscreen.Container data-testid="container">
              <Fullscreen.Close>Close</Fullscreen.Close>
            </Fullscreen.Container>
          </Fullscreen.Portal>
        </Fullscreen.Root>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
      await flushMicrotasks();
      expect(screen.getByTestId('container')).toHaveAttribute('data-fullscreen');

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      await flushMicrotasks();

      expect(stubs.exit).toHaveBeenCalledOnce();
      expect(screen.queryByTestId('container')).toBe(null);
    });

    it('unmounts children when the user exits via the Esc key', async () => {
      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Portal>
            <Fullscreen.Container data-testid="container" />
          </Fullscreen.Portal>
        </Fullscreen.Root>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
      await flushMicrotasks();
      expect(screen.getByTestId('container')).toHaveAttribute('data-fullscreen');

      await act(async () => {
        stubs.setActiveElement(null);
        stubs.dispatchChange();
      });
      await flushMicrotasks();

      expect(screen.queryByTestId('container')).toBe(null);
    });

    it('unmounts children when controlled `open` flips to false', async () => {
      function App() {
        const [open, setOpen] = React.useState(false);
        return (
          <React.Fragment>
            <button type="button" onClick={() => setOpen(true)}>
              External open
            </button>
            <button type="button" onClick={() => setOpen(false)}>
              External close
            </button>
            <Fullscreen.Root open={open} onOpenChange={setOpen}>
              <Fullscreen.Portal>
                <Fullscreen.Container data-testid="container" />
              </Fullscreen.Portal>
            </Fullscreen.Root>
          </React.Fragment>
        );
      }

      await render(<App />);

      fireEvent.click(screen.getByRole('button', { name: 'External open' }));
      await flushMicrotasks();
      expect(screen.getByTestId('container')).toHaveAttribute('data-fullscreen');

      fireEvent.click(screen.getByRole('button', { name: 'External close' }));
      await flushMicrotasks();

      expect(stubs.exit).toHaveBeenCalledOnce();
      expect(screen.queryByTestId('container')).toBe(null);
    });
  });

  describe('keepMounted', () => {
    it('keeps children mounted while the container is not in fullscreen', async () => {
      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Portal keepMounted>
            <Fullscreen.Container data-testid="container" />
          </Fullscreen.Portal>
        </Fullscreen.Root>,
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveAttribute('data-not-fullscreen');
      expect(container.parentElement).toBe(document.body);

      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
      await flushMicrotasks();

      expect(container).toHaveAttribute('data-fullscreen');

      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
      await flushMicrotasks();

      expect(container).toHaveAttribute('data-not-fullscreen');
      expect(screen.getByTestId('container')).toBe(container);
    });

    it('hides the container while not in fullscreen so it does not leak into the page', async () => {
      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Portal keepMounted>
            <Fullscreen.Container data-testid="container" />
          </Fullscreen.Portal>
        </Fullscreen.Root>,
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveAttribute('hidden');

      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
      await flushMicrotasks();

      expect(container).not.toHaveAttribute('hidden');

      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
      await flushMicrotasks();

      expect(container).toHaveAttribute('hidden');
    });

    it('does not set `hidden` on a container rendered without `<Fullscreen.Portal>`', async () => {
      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Container data-testid="container" />
        </Fullscreen.Root>,
      );

      expect(screen.getByTestId('container')).not.toHaveAttribute('hidden');
    });
  });

  describe('container prop', () => {
    it('accepts an `Element`', async () => {
      const target = document.createElement('div');
      target.setAttribute('id', 'portal-target-element');
      document.body.appendChild(target);

      try {
        await render(
          <Fullscreen.Root>
            <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
            <Fullscreen.Portal container={target}>
              <Fullscreen.Container data-testid="container" />
            </Fullscreen.Portal>
          </Fullscreen.Root>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
        await flushMicrotasks();

        expect(screen.getByTestId('container').parentElement).toBe(target);
      } finally {
        target.remove();
      }
    });

    it('accepts a `RefObject`', async () => {
      function App() {
        const ref = React.useRef<HTMLDivElement | null>(null);
        return (
          <React.Fragment>
            <div data-testid="portal-target" ref={ref} />
            <Fullscreen.Root>
              <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
              <Fullscreen.Portal container={ref}>
                <Fullscreen.Container data-testid="container" />
              </Fullscreen.Portal>
            </Fullscreen.Root>
          </React.Fragment>
        );
      }

      await render(<App />);

      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
      await flushMicrotasks();

      const target = screen.getByTestId('portal-target');
      expect(screen.getByTestId('container').parentElement).toBe(target);
    });

    it('accepts a function returning the target element', async () => {
      const target = document.createElement('div');
      target.setAttribute('id', 'portal-target-fn');
      document.body.appendChild(target);

      try {
        await render(
          <Fullscreen.Root>
            <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
            <Fullscreen.Portal container={() => target}>
              <Fullscreen.Container data-testid="container" />
            </Fullscreen.Portal>
          </Fullscreen.Root>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
        await flushMicrotasks();

        expect(screen.getByTestId('container').parentElement).toBe(target);
      } finally {
        target.remove();
      }
    });
  });

  describe('handle integration', () => {
    it('mounts children when a detached trigger sharing a handle is pressed', async () => {
      const handle = Fullscreen.createHandle();

      function App() {
        return (
          <React.Fragment>
            <Fullscreen.Trigger handle={handle}>Toggle</Fullscreen.Trigger>
            <Fullscreen.Root handle={handle}>
              <Fullscreen.Portal>
                <Fullscreen.Container data-testid="container" />
              </Fullscreen.Portal>
            </Fullscreen.Root>
          </React.Fragment>
        );
      }

      await render(<App />);

      expect(screen.queryByTestId('container')).toBe(null);

      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
      await flushMicrotasks();

      const container = screen.getByTestId('container');
      expect(container).toHaveAttribute('data-fullscreen');
      expect(stubs.request).toHaveBeenCalledOnce();
    });

    it('mounts children when `handle.open()` is called from a click handler', async () => {
      const handle = Fullscreen.createHandle();

      function App() {
        return (
          <React.Fragment>
            <button type="button" onClick={() => handle.open()}>
              Imperative open
            </button>
            <Fullscreen.Root handle={handle}>
              <Fullscreen.Portal>
                <Fullscreen.Container data-testid="container" />
              </Fullscreen.Portal>
            </Fullscreen.Root>
          </React.Fragment>
        );
      }

      await render(<App />);

      expect(screen.queryByTestId('container')).toBe(null);

      fireEvent.click(screen.getByRole('button', { name: 'Imperative open' }));
      await flushMicrotasks();

      const container = screen.getByTestId('container');
      expect(container).toHaveAttribute('data-fullscreen');
      expect(stubs.request).toHaveBeenCalledOnce();
      expect(handle.isOpen).toBe(true);
    });
  });
});
