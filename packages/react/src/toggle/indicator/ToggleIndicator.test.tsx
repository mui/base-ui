import { expect, describe, it, vi } from 'vitest';
import * as React from 'react';
import { fireEvent, reactMajor, screen, waitFor } from '@mui/internal-test-utils';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<Toggle.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(<Toggle.Indicator />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(<Toggle.Root>{node}</Toggle.Root>);
    },
  }));

  it('throws a descriptive error when rendered outside <Toggle.Root>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Toggle.Indicator />)).rejects.toThrow(
        'Base UI: ToggleRootContext is missing. Toggle parts must be placed within <Toggle.Root>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('contributes its text to the toggle accessible name', async () => {
    const { user } = await render(
      <Toggle.Root>
        <Toggle.Indicator match="off">Show</Toggle.Indicator>
        <Toggle.Indicator match="on">Hide</Toggle.Indicator>
      </Toggle.Root>,
    );

    await user.click(screen.getByRole('button', { name: 'Show' }));
    expect(screen.getByRole('button', { name: 'Hide' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('reflects the pressed state through data-pressed', async () => {
    const { user } = await render(
      <Toggle.Root>
        <Toggle.Indicator data-testid="indicator" />
      </Toggle.Root>,
    );

    const indicator = screen.getByTestId('indicator');
    expect(indicator).not.toHaveAttribute('data-pressed');

    await user.click(screen.getByRole('button'));
    expect(indicator).toHaveAttribute('data-pressed');
  });

  it('reflects the disabled state through data-disabled', async () => {
    await render(
      <Toggle.Root disabled>
        <Toggle.Indicator data-testid="indicator" />
      </Toggle.Root>,
    );

    expect(screen.getByTestId('indicator')).toHaveAttribute('data-disabled');
  });

  it('reflects the pressed state inside a toggle group', async () => {
    const { user } = await render(
      <ToggleGroup>
        <Toggle.Root value="bold">
          <Toggle.Indicator data-testid="indicator" />
        </Toggle.Root>
      </ToggleGroup>,
    );

    const indicator = screen.getByTestId('indicator');
    expect(indicator).not.toHaveAttribute('data-pressed');

    await user.click(screen.getByRole('button'));
    expect(indicator).toHaveAttribute('data-pressed');
  });

  it('stays mounted without match', async () => {
    const { user } = await render(
      <Toggle.Root>
        <Toggle.Indicator data-testid="indicator" />
      </Toggle.Root>,
    );

    const indicator = screen.getByTestId('indicator');

    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('indicator')).toBe(indicator);

    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('indicator')).toBe(indicator);
  });

  describe('prop: match', () => {
    it.each([
      { name: 'pressed', match: 'on' as const, initiallyRendered: false },
      { name: 'unpressed', match: 'off' as const, initiallyRendered: true },
    ])('renders only while the toggle is $name', async ({ match, initiallyRendered }) => {
      const { user } = await render(
        <Toggle.Root>
          <Toggle.Indicator data-testid="indicator" match={match} />
        </Toggle.Root>,
      );

      expect(screen.queryByTestId('indicator') !== null).toBe(initiallyRendered);

      await user.click(screen.getByRole('button'));
      expect(screen.queryByTestId('indicator') !== null).toBe(!initiallyRendered);

      await user.click(screen.getByRole('button'));
      expect(screen.queryByTestId('indicator') !== null).toBe(initiallyRendered);
    });

    it('swaps between a pair of indicators', async () => {
      const { user } = await render(
        <Toggle.Root>
          <Toggle.Indicator match="off">off</Toggle.Indicator>
          <Toggle.Indicator match="on">on</Toggle.Indicator>
        </Toggle.Root>,
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toBe('off');

      await user.click(button);
      expect(button.textContent).toBe('on');
    });

    // The Flight client passes a render element created in a Server Component as a `react.lazy`
    // wrapper, which suspends until its chunk loads.
    it.skipIf(reactMajor < 19)(
      'does not suspend the toggle on a pending render element while not rendered',
      async () => {
        const pendingRender = {
          $$typeof: Symbol.for('react.lazy'),
          _payload: null,
          _init: () => {
            throw new Promise(() => {});
          },
        } as unknown as React.ReactElement;

        await render(
          <React.Suspense fallback={<div data-testid="fallback" />}>
            <Toggle.Root>
              <Toggle.Indicator match="on" render={pendingRender} />
            </Toggle.Root>
          </React.Suspense>,
        );

        expect(screen.queryByTestId('fallback')).toBe(null);
        expect(screen.getByRole('button')).not.toBe(null);
      },
    );
  });

  describe.skipIf(isJSDOM)('animations', () => {
    it('applies data-starting-style when mounting', async () => {
      await render(
        <Toggle.Root>
          <Toggle.Indicator data-testid="indicator" match="on" />
        </Toggle.Root>,
      );

      expect(screen.queryByTestId('indicator')).toBe(null);

      // `user.click` can yield a frame, which is long enough for the starting style to clear.
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByTestId('indicator')).toHaveAttribute('data-starting-style');
    });

    it('applies data-ending-style before unmount', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      const style = `
        @keyframes test-anim {
          to {
            opacity: 0;
          }
        }

        .animation-test-indicator[data-ending-style] {
          animation: test-anim 1ms;
        }
      `;

      await render(
        <div>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          <Toggle.Root defaultPressed>
            <Toggle.Indicator
              className="animation-test-indicator"
              data-testid="indicator"
              match="on"
            />
          </Toggle.Root>
        </div>,
      );

      expect(screen.getByTestId('indicator')).not.toHaveAttribute('data-ending-style');

      // `user.click` can yield a frame, which is long enough for the 1ms animation to finish.
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByTestId('indicator')).toHaveAttribute('data-ending-style');

      await waitFor(() => {
        expect(screen.queryByTestId('indicator')).toBe(null);
      });
    });
  });
});
