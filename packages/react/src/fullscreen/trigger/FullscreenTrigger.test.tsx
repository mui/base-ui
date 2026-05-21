import { expect, vi } from 'vitest';
import * as React from 'react';
import { fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { Fullscreen } from '@base-ui/react/fullscreen';
import { createRenderer, describeConformance } from '#test-utils';
import { installFullscreenApiStubs, type FullscreenApiStubs } from '../root/fullscreenApiTestUtils';

describe('<Fullscreen.Trigger />', () => {
  const { render } = createRenderer();

  describeConformance(<Fullscreen.Trigger />, () => ({
    refInstanceof: window.HTMLButtonElement,
    testComponentPropWith: 'button',
    button: true,
    render: (node) => {
      return render(<Fullscreen.Root>{node}</Fullscreen.Root>);
    },
  }));

  describe('ARIA attributes', () => {
    let stubs: FullscreenApiStubs;

    beforeEach(() => {
      stubs = installFullscreenApiStubs();
    });

    afterEach(() => {
      stubs.restore();
    });

    it('points aria-controls at the container element', async () => {
      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Container data-testid="container" />
        </Fullscreen.Root>,
      );

      const trigger = screen.getByRole('button');
      const container = screen.getByTestId('container');

      expect(trigger).toHaveAttribute('aria-controls', container.getAttribute('id'));
      expect(trigger).toHaveAttribute('aria-pressed', 'false');
    });

    it('honors a manual `id` on the container', async () => {
      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Container id="custom-fullscreen" />
        </Fullscreen.Root>,
      );

      expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'custom-fullscreen');
    });
  });

  describe('data attributes', () => {
    let stubs: FullscreenApiStubs;

    beforeEach(() => {
      stubs = installFullscreenApiStubs();
    });

    afterEach(() => {
      stubs.restore();
    });

    it('reflects the fullscreen state with `data-fullscreen` and `data-not-fullscreen`', async () => {
      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger>Toggle</Fullscreen.Trigger>
          <Fullscreen.Container />
        </Fullscreen.Root>,
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('data-not-fullscreen');
      expect(trigger).not.toHaveAttribute('data-fullscreen');

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(trigger).toHaveAttribute('data-fullscreen');
      expect(trigger).not.toHaveAttribute('data-not-fullscreen');
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
      const classNameSpy = vi.fn().mockReturnValue('trigger-class');
      const styleSpy = vi.fn().mockReturnValue({ color: 'red' });

      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger
            className={classNameSpy}
            style={styleSpy}
            render={(props, state) => {
              renderSpy(state);
              return (
                <button type="button" {...props}>
                  Toggle
                </button>
              );
            }}
          />
          <Fullscreen.Container />
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

    it('reports `disabled: true` in render-prop state when the API is unsupported', async () => {
      stubs.setEnabled(false);
      const renderSpy = vi.fn();

      await render(
        <Fullscreen.Root>
          <Fullscreen.Trigger
            render={(props, state) => {
              renderSpy(state);
              return (
                <button type="button" {...props}>
                  Toggle
                </button>
              );
            }}
          />
          <Fullscreen.Container />
        </Fullscreen.Root>,
      );

      const state = renderSpy.mock.calls.at(-1)?.[0];
      expect(state).toEqual({ open: false, disabled: true, supported: false });
    });
  });
});
