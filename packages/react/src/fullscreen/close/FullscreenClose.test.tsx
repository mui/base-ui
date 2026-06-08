import { expect, vi } from 'vitest';
import * as React from 'react';
import { fireEvent, screen, flushMicrotasks } from '@mui/internal-test-utils';
import { Fullscreen } from '@base-ui/react/fullscreen';
import { createRenderer, describeConformance } from '#test-utils';
import { REASONS } from '../../internals/reasons';
import { installFullscreenApiStubs, type FullscreenApiStubs } from '../root/fullscreenApiTestUtils';

describe('<Fullscreen.Close />', () => {
  const { render } = createRenderer();

  describeConformance(<Fullscreen.Close />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
    render: (node) => {
      return render(
        <Fullscreen.Root>
          <Fullscreen.Container>{node}</Fullscreen.Container>
        </Fullscreen.Root>,
      );
    },
  }));

  describe('behavior', () => {
    let stubs: FullscreenApiStubs;

    beforeEach(() => {
      stubs = installFullscreenApiStubs();
    });

    afterEach(() => {
      stubs.restore();
    });

    it('exits fullscreen when pressed while open', async () => {
      const handleOpenChange = vi.fn();

      await render(
        <Fullscreen.Root onOpenChange={handleOpenChange}>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Container>
            <Fullscreen.Close>Close</Fullscreen.Close>
          </Fullscreen.Container>
        </Fullscreen.Root>,
      );

      const toggle = screen.getByRole('button', { name: 'Toggle' });
      fireEvent.click(toggle);
      await flushMicrotasks();

      expect(toggle).toHaveAttribute('aria-pressed', 'true');
      handleOpenChange.mockClear();

      const close = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(close);
      await flushMicrotasks();

      expect(stubs.exit).toHaveBeenCalledOnce();
      expect(handleOpenChange).toHaveBeenLastCalledWith(
        false,
        expect.objectContaining({ reason: REASONS.closePress }),
      );
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });

    it('is a no-op when not currently open', async () => {
      const handleOpenChange = vi.fn();

      await render(
        <Fullscreen.Root onOpenChange={handleOpenChange}>
          <Fullscreen.Container>
            <Fullscreen.Close>Close</Fullscreen.Close>
          </Fullscreen.Container>
        </Fullscreen.Root>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      await flushMicrotasks();

      expect(stubs.exit).not.toHaveBeenCalled();
      expect(handleOpenChange).not.toHaveBeenCalled();
    });

    it('reflects the fullscreen state with `data-fullscreen` and `data-not-fullscreen`', async () => {
      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Container>
            <Fullscreen.Close>Close</Fullscreen.Close>
          </Fullscreen.Container>
        </Fullscreen.Root>,
      );

      const close = screen.getByRole('button', { name: 'Close' });
      expect(close).toHaveAttribute('data-not-fullscreen');
      expect(close).not.toHaveAttribute('data-fullscreen');

      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
      await flushMicrotasks();

      expect(close).toHaveAttribute('data-fullscreen');
      expect(close).not.toHaveAttribute('data-not-fullscreen');
    });

    it('respects `disabled`', async () => {
      const handleOpenChange = vi.fn();

      await render(
        <Fullscreen.Root onOpenChange={handleOpenChange}>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Container>
            <Fullscreen.Close disabled>Close</Fullscreen.Close>
          </Fullscreen.Container>
        </Fullscreen.Root>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
      await flushMicrotasks();
      handleOpenChange.mockClear();

      const close = screen.getByRole('button', { name: 'Close' });
      expect(close).toHaveAttribute('data-disabled');
      expect(close).toHaveAttribute('disabled');

      fireEvent.click(close);
      await flushMicrotasks();
      expect(handleOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('render prop state', () => {
    let stubs: FullscreenApiStubs;

    beforeEach(() => {
      stubs = installFullscreenApiStubs();
    });

    afterEach(() => {
      stubs.restore();
    });

    it('passes the fullscreen state to render, className, and style callbacks', async () => {
      const renderSpy = vi.fn();
      const classNameSpy = vi.fn().mockReturnValue('close-class');
      const styleSpy = vi.fn().mockReturnValue({ color: 'red' });

      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Container>
            <Fullscreen.Close
              className={classNameSpy}
              style={styleSpy}
              render={(props, state) => {
                renderSpy(state);
                return (
                  <button type="button" {...props}>
                    Close
                  </button>
                );
              }}
            />
          </Fullscreen.Container>
        </Fullscreen.Root>,
      );

      const initialState = renderSpy.mock.calls.at(-1)?.[0];
      expect(initialState).toEqual({ open: false, disabled: false, supported: true });
      expect(classNameSpy).toHaveBeenLastCalledWith(initialState);
      expect(styleSpy).toHaveBeenLastCalledWith(initialState);

      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
      await flushMicrotasks();

      const openState = renderSpy.mock.calls.at(-1)?.[0];
      expect(openState).toEqual({ open: true, disabled: false, supported: true });
      expect(classNameSpy).toHaveBeenLastCalledWith(openState);
      expect(styleSpy).toHaveBeenLastCalledWith(openState);
    });
  });
});
