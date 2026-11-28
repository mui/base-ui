import { expect, describe, it, afterEach, vi } from 'vitest';
import * as React from 'react';
import { fireEvent, reactMajor, screen, waitFor } from '@mui/internal-test-utils';
import { PasswordFieldPreview as PasswordField } from '@base-ui/react/password-field';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<PasswordField.ToggleIndicator />', () => {
  const { render } = createRenderer();

  describeConformance(<PasswordField.ToggleIndicator />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(<PasswordField.Root>{node}</PasswordField.Root>);
    },
  }));

  it('throws a descriptive error when rendered outside <PasswordField.Root>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<PasswordField.ToggleIndicator />)).rejects.toThrow(
        'Base UI: PasswordFieldRootContext is missing. PasswordField parts must be placed within <PasswordField.Root>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('is hidden from assistive technology', async () => {
    await render(
      <PasswordField.Root defaultRevealed>
        <PasswordField.ToggleIndicator data-testid="indicator" />
      </PasswordField.Root>,
    );

    expect(screen.getByTestId('indicator')).toHaveAttribute('aria-hidden', 'true');
  });

  it('stays mounted without match and reflects the visibility through data-revealed', async () => {
    const { user } = await render(
      <PasswordField.Root>
        <PasswordField.Toggle />
        <PasswordField.ToggleIndicator data-testid="indicator" />
      </PasswordField.Root>,
    );

    const indicator = screen.getByTestId('indicator');
    expect(indicator).not.toHaveAttribute('data-revealed');

    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('indicator')).toBe(indicator);
    expect(indicator).toHaveAttribute('data-revealed');

    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('indicator')).toBe(indicator);
    expect(indicator).not.toHaveAttribute('data-revealed');
  });

  describe('prop: match', () => {
    it.each([
      { name: 'revealed', match: 'on' as const, initiallyRendered: false },
      { name: 'masked', match: 'off' as const, initiallyRendered: true },
    ])('renders only while the password is $name', async ({ match, initiallyRendered }) => {
      const { user } = await render(
        <PasswordField.Root>
          <PasswordField.Toggle />
          <PasswordField.ToggleIndicator data-testid="indicator" match={match} />
        </PasswordField.Root>,
      );

      expect(screen.queryByTestId('indicator') !== null).toBe(initiallyRendered);

      await user.click(screen.getByRole('button'));
      expect(screen.queryByTestId('indicator') !== null).toBe(!initiallyRendered);

      await user.click(screen.getByRole('button'));
      expect(screen.queryByTestId('indicator') !== null).toBe(initiallyRendered);
    });

    // The Flight client passes a render element created in a Server Component as a `react.lazy`
    // wrapper, which suspends until its chunk loads.
    it.skipIf(reactMajor < 19)(
      'does not suspend the field on a pending render element while not rendered',
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
            <PasswordField.Root>
              <PasswordField.Input />
              <PasswordField.ToggleIndicator match="on" render={pendingRender} />
            </PasswordField.Root>
          </React.Suspense>,
        );

        expect(screen.queryByTestId('fallback')).toBe(null);
        expect(document.querySelector('input')).not.toBe(null);
      },
    );
  });

  describe.skipIf(isJSDOM)('animations', () => {
    afterEach(() => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
    });

    it('applies data-starting-style when mounting', async () => {
      globalThis.BASE_UI_ANIMATIONS_DISABLED = false;

      await render(
        <PasswordField.Root>
          <PasswordField.Toggle />
          <PasswordField.ToggleIndicator data-testid="indicator" match="on" />
        </PasswordField.Root>,
      );

      expect(screen.queryByTestId('indicator')).toBe(null);

      // Synchronous, so the transient starting-style render is observable.
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByTestId('indicator')).toHaveAttribute('data-starting-style');

      await waitFor(() => {
        expect(screen.getByTestId('indicator')).not.toHaveAttribute('data-starting-style');
      });
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
          <PasswordField.Root defaultRevealed>
            <PasswordField.Toggle />
            <PasswordField.ToggleIndicator
              className="animation-test-indicator"
              data-testid="indicator"
              match="on"
            />
          </PasswordField.Root>
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
