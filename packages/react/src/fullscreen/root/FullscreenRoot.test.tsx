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

    it('does not update internal state in controlled mode', async () => {
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
      expect(stubs.request).toHaveBeenCalled();
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
});
