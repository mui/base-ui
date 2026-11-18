import { expect, describe, it, afterEach } from 'vitest';
import * as React from 'react';
import { fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { PasswordFieldPreview as PasswordField } from '@base-ui/react/password-field';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<PasswordField.Indicator />', () => {
  const { render } = createRenderer();

  describeConformance(<PasswordField.Indicator keepMounted />, () => ({
    refInstanceof: window.HTMLSpanElement,
    render(node) {
      return render(<PasswordField.Root>{node}</PasswordField.Root>);
    },
  }));

  it('is hidden from assistive technology', async () => {
    await render(
      <PasswordField.Root defaultVisible>
        <PasswordField.Indicator data-testid="indicator" />
      </PasswordField.Root>,
    );

    expect(screen.getByTestId('indicator')).toHaveAttribute('aria-hidden', 'true');
  });

  it('reflects the visibility through data-visible', async () => {
    const { user } = await render(
      <PasswordField.Root>
        <PasswordField.Toggle />
        <PasswordField.Indicator data-testid="indicator" keepMounted />
      </PasswordField.Root>,
    );

    const indicator = screen.getByTestId('indicator');
    expect(indicator).not.toHaveAttribute('data-visible');

    await user.click(screen.getByRole('button'));
    expect(indicator).toHaveAttribute('data-visible');
  });

  describe('prop: match', () => {
    it.each([
      { name: 'visible (default)', match: undefined, initiallyRendered: false },
      { name: 'visible', match: 'visible' as const, initiallyRendered: false },
      { name: 'hidden', match: 'hidden' as const, initiallyRendered: true },
    ])('renders only while the password is $name', async ({ match, initiallyRendered }) => {
      const { user } = await render(
        <PasswordField.Root>
          <PasswordField.Toggle />
          <PasswordField.Indicator data-testid="indicator" match={match} />
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
            <PasswordField.Indicator match="hidden">show</PasswordField.Indicator>
            <PasswordField.Indicator match="visible">hide</PasswordField.Indicator>
          </PasswordField.Toggle>
        </PasswordField.Root>,
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toBe('show');

      await user.click(button);
      expect(button.textContent).toBe('hide');
    });
  });

  describe('prop: keepMounted', () => {
    it('keeps the element in the DOM while it does not apply', async () => {
      await render(
        <PasswordField.Root>
          <PasswordField.Indicator data-testid="indicator" keepMounted />
        </PasswordField.Root>,
      );

      expect(screen.getByTestId('indicator')).not.toHaveAttribute('data-visible');
    });
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
            <PasswordField.Indicator className="animation-test-indicator" data-testid="indicator" />
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
