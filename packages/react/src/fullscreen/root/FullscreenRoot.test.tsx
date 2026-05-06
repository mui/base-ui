import { expect, vi } from 'vitest';
import * as React from 'react';
import { act, fireEvent, screen, flushMicrotasks } from '@mui/internal-test-utils';
import { Fullscreen } from '@base-ui/react/fullscreen';
import { createRenderer } from '#test-utils';
import { REASONS } from '../../internals/reasons';
import { installFullscreenApiStubs, type FullscreenApiStubs } from './fullscreenApiTestUtils';

describe('<Fullscreen.Root />', () => {
  const { render } = createRenderer();
  let stubs: FullscreenApiStubs;

  beforeEach(() => {
    stubs = installFullscreenApiStubs();
  });

  afterEach(() => {
    stubs.restore();
  });

  describe('rendering', () => {
    it('does not render its own DOM element', async () => {
      const { container } = await render(
        <Fullscreen.Root>
          <Fullscreen.Container data-testid="container" />
        </Fullscreen.Root>,
      );

      expect(container.children.length).toBe(1);
      expect(container.firstElementChild).toBe(screen.getByTestId('container'));
    });
  });

  describe('controlled and uncontrolled', () => {
    it('honors `defaultOpen={false}`', async () => {
      await render(
        <Fullscreen.Root defaultOpen={false}>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Container data-testid="container" />
        </Fullscreen.Root>,
      );

      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTestId('container')).toHaveAttribute('data-not-fullscreen');
    });

    it('toggles state on trigger press while uncontrolled', async () => {
      const handleOpenChange = vi.fn();

      await render(
        <Fullscreen.Root onOpenChange={handleOpenChange}>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Container data-testid="container" />
        </Fullscreen.Root>,
      );

      const trigger = screen.getByRole('button');
      const container = screen.getByTestId('container');

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(stubs.request).toHaveBeenCalledOnce();
      expect(handleOpenChange).toHaveBeenLastCalledWith(
        true,
        expect.objectContaining({ reason: REASONS.triggerPress }),
      );
      expect(trigger).toHaveAttribute('aria-pressed', 'true');
      expect(container).toHaveAttribute('data-fullscreen');

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(stubs.exit).toHaveBeenCalledOnce();
      expect(handleOpenChange).toHaveBeenLastCalledWith(
        false,
        expect.objectContaining({ reason: REASONS.triggerPress }),
      );
      expect(trigger).toHaveAttribute('aria-pressed', 'false');
      expect(container).toHaveAttribute('data-not-fullscreen');
    });

    it('does not update internal state or call the API in controlled mode when the parent ignores onOpenChange', async () => {
      function ControlledFullscreen() {
        const [open] = React.useState(false);
        return (
          <Fullscreen.Root open={open} onOpenChange={() => undefined}>
            <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
            <Fullscreen.Container data-testid="container" />
          </Fullscreen.Root>
        );
      }

      await render(<ControlledFullscreen />);

      const trigger = screen.getByRole('button', { name: 'Toggle' });
      const container = screen.getByTestId('container');

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(trigger).toHaveAttribute('aria-pressed', 'false');
      expect(container).toHaveAttribute('data-not-fullscreen');
      // Because the parent ignored `onOpenChange`, `open` never flipped, so the
      // browser API is never called either.
      expect(stubs.request).not.toHaveBeenCalled();
    });

    it('toggles via the bundled trigger in controlled mode', async () => {
      function ControlledFullscreen() {
        const [open, setOpen] = React.useState(false);
        return (
          <Fullscreen.Root open={open} onOpenChange={setOpen}>
            <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
            <Fullscreen.Container data-testid="container" />
          </Fullscreen.Root>
        );
      }

      await render(<ControlledFullscreen />);

      const trigger = screen.getByRole('button', { name: 'Toggle' });
      const container = screen.getByTestId('container');

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(stubs.request).toHaveBeenCalledOnce();
      expect(trigger).toHaveAttribute('aria-pressed', 'true');
      expect(container).toHaveAttribute('data-fullscreen');

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(stubs.exit).toHaveBeenCalledOnce();
      expect(trigger).toHaveAttribute('aria-pressed', 'false');
      expect(container).toHaveAttribute('data-not-fullscreen');
    });

    it('drives the browser API when controlled `open` is flipped from outside', async () => {
      function ControlledFullscreen() {
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
              <Fullscreen.Container data-testid="container" />
            </Fullscreen.Root>
          </React.Fragment>
        );
      }

      await render(<ControlledFullscreen />);

      const externalOpen = screen.getByRole('button', { name: 'External open' });
      const externalClose = screen.getByRole('button', { name: 'External close' });
      const container = screen.getByTestId('container');

      fireEvent.click(externalOpen);
      await flushMicrotasks();

      expect(stubs.request).toHaveBeenCalledOnce();
      expect(container).toHaveAttribute('data-fullscreen');

      fireEvent.click(externalClose);
      await flushMicrotasks();

      expect(stubs.exit).toHaveBeenCalledOnce();
      expect(container).toHaveAttribute('data-not-fullscreen');
    });

    it('reverts `open` and dispatches `reason: none` when `requestFullscreen` is rejected', async () => {
      stubs.request.mockImplementation(() => Promise.reject(new TypeError('blocked')));
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const handleOpenChange = vi.fn();

      function ControlledFullscreen() {
        const [open, setOpen] = React.useState(false);
        return (
          <React.Fragment>
            <button
              type="button"
              onClick={() => {
                setOpen(true);
              }}
            >
              External open
            </button>
            <Fullscreen.Root
              open={open}
              onOpenChange={(nextOpen, details) => {
                setOpen(nextOpen);
                handleOpenChange(nextOpen, details);
              }}
            >
              <Fullscreen.Container data-testid="container" />
            </Fullscreen.Root>
          </React.Fragment>
        );
      }

      await render(<ControlledFullscreen />);

      fireEvent.click(screen.getByRole('button', { name: 'External open' }));
      await flushMicrotasks();

      expect(stubs.request).toHaveBeenCalledOnce();
      expect(handleOpenChange).toHaveBeenLastCalledWith(
        false,
        expect.objectContaining({ reason: REASONS.none }),
      );
      expect(screen.getByTestId('container')).toHaveAttribute('data-not-fullscreen');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('`requestFullscreen()` was rejected'),
      );

      warnSpy.mockRestore();
    });
  });

  describe('disabled', () => {
    it('passes disabled to the trigger via context', async () => {
      await render(
        <Fullscreen.Root disabled>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Container />
        </Fullscreen.Root>,
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('data-disabled');
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
    });

    it('does not call requestFullscreen when disabled', async () => {
      await render(
        <Fullscreen.Root disabled>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Container />
        </Fullscreen.Root>,
      );

      fireEvent.click(screen.getByRole('button'));
      await flushMicrotasks();

      expect(stubs.request).not.toHaveBeenCalled();
    });
  });

  describe('unsupported', () => {
    it('disables the trigger when fullscreenEnabled is false', async () => {
      stubs.setEnabled(false);

      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Container />
        </Fullscreen.Root>,
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('data-disabled');
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('container unmount', () => {
    it('resets state and dispatches `onOpenChange` when the container unmounts while in fullscreen', async () => {
      const handleOpenChange = vi.fn();

      function App({ mounted }: { mounted: boolean }) {
        return (
          <Fullscreen.Root onOpenChange={handleOpenChange}>
            <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
            {mounted && <Fullscreen.Container data-testid="container" />}
          </Fullscreen.Root>
        );
      }

      const { setProps } = await render(<App mounted />);

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(trigger).toHaveAttribute('aria-pressed', 'true');
      handleOpenChange.mockClear();

      await setProps({ mounted: false });
      await flushMicrotasks();

      expect(handleOpenChange).toHaveBeenLastCalledWith(
        false,
        expect.objectContaining({ reason: REASONS.none }),
      );
      expect(trigger).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('external fullscreenchange', () => {
    it('updates open and dispatches reason=escape-key when the browser exits without our request', async () => {
      const handleOpenChange = vi.fn();

      await render(
        <Fullscreen.Root onOpenChange={handleOpenChange}>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Container data-testid="container" />
        </Fullscreen.Root>,
      );

      const trigger = screen.getByRole('button');

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(trigger).toHaveAttribute('aria-pressed', 'true');
      handleOpenChange.mockClear();

      await act(async () => {
        stubs.setActiveElement(null);
        stubs.dispatchChange();
      });
      await flushMicrotasks();

      expect(handleOpenChange).toHaveBeenLastCalledWith(
        false,
        expect.objectContaining({ reason: REASONS.escapeKey }),
      );
      expect(trigger).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('target prop', () => {
    let externalTarget: HTMLElement | null = null;

    beforeEach(() => {
      externalTarget = document.createElement('section');
      externalTarget.id = 'external-section';
      document.body.appendChild(externalTarget);
    });

    afterEach(() => {
      if (externalTarget && externalTarget.parentNode) {
        externalTarget.parentNode.removeChild(externalTarget);
      }
      externalTarget = null;
    });

    it('opens the external element when target is a getter and the trigger is clicked', async () => {
      await render(
        <Fullscreen.Root target={() => externalTarget}>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
        </Fullscreen.Root>,
      );

      const trigger = screen.getByRole('button', { name: 'Toggle' });
      expect(trigger).toHaveAttribute('aria-controls', 'external-section');

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(stubs.request).toHaveBeenCalledOnce();
      expect(stubs.request.mock.instances[0]).toBe(externalTarget);
      expect(trigger).toHaveAttribute('aria-pressed', 'true');

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(stubs.exit).toHaveBeenCalledOnce();
      expect(trigger).toHaveAttribute('aria-pressed', 'false');
    });

    it('opens the external element when target is a ref', async () => {
      function App() {
        const ref = React.useRef<HTMLElement | null>(null);
        React.useEffect(() => {
          ref.current = externalTarget;
        }, []);
        return (
          <Fullscreen.Root target={ref}>
            <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          </Fullscreen.Root>
        );
      }

      await render(<App />);

      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
      await flushMicrotasks();

      expect(stubs.request).toHaveBeenCalledOnce();
      expect(stubs.request.mock.instances[0]).toBe(externalTarget);
    });

    it('reconciles state when the browser exits fullscreen via Esc', async () => {
      const handleOpenChange = vi.fn();

      await render(
        <Fullscreen.Root target={() => externalTarget} onOpenChange={handleOpenChange}>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
        </Fullscreen.Root>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
      await flushMicrotasks();
      handleOpenChange.mockClear();

      await act(async () => {
        stubs.setActiveElement(null);
        stubs.dispatchChange();
      });
      await flushMicrotasks();

      expect(handleOpenChange).toHaveBeenLastCalledWith(
        false,
        expect.objectContaining({ reason: REASONS.escapeKey }),
      );
      expect(screen.getByRole('button', { name: 'Toggle' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('drives the external element from a controlled `open` change', async () => {
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
            <Fullscreen.Root open={open} onOpenChange={setOpen} target={() => externalTarget} />
          </React.Fragment>
        );
      }

      await render(<App />);

      fireEvent.click(screen.getByRole('button', { name: 'External open' }));
      await flushMicrotasks();

      expect(stubs.request).toHaveBeenCalledOnce();
      expect(stubs.request.mock.instances[0]).toBe(externalTarget);

      fireEvent.click(screen.getByRole('button', { name: 'External close' }));
      await flushMicrotasks();

      expect(stubs.exit).toHaveBeenCalledOnce();
    });
  });
});
