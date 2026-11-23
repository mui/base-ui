import { expect, describe, it, afterEach } from 'vitest';
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

  it('is hidden from assistive technology', async () => {
    await render(
      <PasswordField.Root defaultVisible>
        <PasswordField.ToggleIndicator data-testid="indicator" />
      </PasswordField.Root>,
    );

    expect(screen.getByTestId('indicator')).toHaveAttribute('aria-hidden', 'true');
  });

  it('stays mounted without match and reflects the visibility through data-visible', async () => {
    const { user } = await render(
      <PasswordField.Root>
        <PasswordField.Toggle />
        <PasswordField.ToggleIndicator data-testid="indicator" />
      </PasswordField.Root>,
    );

    const indicator = screen.getByTestId('indicator');
    expect(indicator).not.toHaveAttribute('data-visible');

    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('indicator')).toBe(indicator);
    expect(indicator).toHaveAttribute('data-visible');

    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('indicator')).toBe(indicator);
    expect(indicator).not.toHaveAttribute('data-visible');
  });

  describe('prop: match', () => {
    it.each([
      { name: 'visible', match: 'password-visible' as const, initiallyRendered: false },
      { name: 'masked', match: 'password-masked' as const, initiallyRendered: true },
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

    it('swaps between a pair of indicators', async () => {
      const { user } = await render(
        <PasswordField.Root>
          <PasswordField.Toggle>
            <PasswordField.ToggleIndicator match="password-masked">
              show
            </PasswordField.ToggleIndicator>
            <PasswordField.ToggleIndicator match="password-visible">
              hide
            </PasswordField.ToggleIndicator>
          </PasswordField.Toggle>
        </PasswordField.Root>,
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toBe('show');

      await user.click(button);
      expect(button.textContent).toBe('hide');
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
              <PasswordField.ToggleIndicator match="password-visible" render={pendingRender} />
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
          <PasswordField.Root defaultVisible>
            <PasswordField.Toggle />
            <PasswordField.ToggleIndicator
              className="animation-test-indicator"
              data-testid="indicator"
              match="password-visible"
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
