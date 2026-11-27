import { beforeEach, expect, vi, describe, it, onTestFinished } from 'vitest';
import * as React from 'react';
import { act, ignoreActWarnings, screen } from '@mui/internal-test-utils';
import { PasswordFieldPreview as PasswordField } from '@base-ui/react/password-field';
import { createRenderer, describeConformance, isJSDOM, resetBrowserPointer } from '#test-utils';

describe('<PasswordField.Toggle />', () => {
  const { render } = createRenderer();

  describeConformance(<PasswordField.Toggle />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render(node) {
      return render(<PasswordField.Root>{node}</PasswordField.Root>);
    },
  }));

  it('toggles the password visibility when clicked', async () => {
    await render(
      <PasswordField.Root>
        <PasswordField.Input />
        <PasswordField.Toggle />
      </PasswordField.Root>,
    );

    const input = document.querySelector('input')!;
    const button = screen.getByRole('button');

    expect(input).toHaveAttribute('type', 'password');

    await act(async () => {
      button.click();
    });
    expect(input).toHaveAttribute('type', 'text');

    await act(async () => {
      button.click();
    });
    expect(input).toHaveAttribute('type', 'password');
  });

  it('reflects the visibility through aria-pressed, data-pressed and data-revealed', async () => {
    await render(
      <PasswordField.Root>
        <PasswordField.Input />
        <PasswordField.Toggle />
      </PasswordField.Root>,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).not.toHaveAttribute('data-pressed');
    expect(button).not.toHaveAttribute('data-revealed');

    await act(async () => {
      button.click();
    });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-pressed');
    expect(button).toHaveAttribute('data-revealed');
  });

  it('stays a non-submitting button even if a consumer passes type="submit"', async () => {
    await render(
      <PasswordField.Root>
        <PasswordField.Input />
        {/* @ts-expect-error `type` is not part of the props */}
        <PasswordField.Toggle type="submit" />
      </PasswordField.Root>,
    );

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  describe('accessible label', () => {
    it('does not set a default aria-label (the consumer provides a localized one)', async () => {
      await render(
        <PasswordField.Root>
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
      );

      expect(screen.getByRole('button')).not.toHaveAttribute('aria-label');
    });
  });

  describe('prop: disabled', () => {
    it('disables the native button', async () => {
      await render(
        <PasswordField.Root>
          <PasswordField.Input />
          <PasswordField.Toggle disabled />
        </PasswordField.Root>,
      );

      const button = screen.getByRole('button');

      // A disabled native button never dispatches a click, so the non-native variant below covers
      // the click itself.
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('data-disabled');
    });
  });

  describe('prop: nativeButton', () => {
    it('toggles the password visibility when rendered as a non-native button', async () => {
      await render(
        <PasswordField.Root>
          <PasswordField.Input />
          <PasswordField.Toggle nativeButton={false} render={<span />} />
        </PasswordField.Root>,
      );

      const input = document.querySelector('input')!;
      const button = screen.getByRole('button');

      await act(async () => {
        button.click();
      });
      expect(input).toHaveAttribute('type', 'text');
    });

    it('expresses disabled via aria-disabled and does not toggle when disabled', async () => {
      await render(
        <PasswordField.Root>
          <PasswordField.Input />
          <PasswordField.Toggle nativeButton={false} render={<span />} disabled />
        </PasswordField.Root>,
      );

      const input = document.querySelector('input')!;
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).not.toBeDisabled();

      await act(async () => {
        button.click();
      });
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  // Testing Library's `user.click` moves focus itself, so these use real browser input.
  describe.skipIf(isJSDOM)('focus management', () => {
    beforeEach(() => {
      ignoreActWarnings();
    });

    it('keeps focus and the selection on the input when toggled with a pointer', async () => {
      onTestFinished(resetBrowserPointer);
      const { userEvent } = await import('vitest/browser');
      await render(
        <PasswordField.Root>
          <PasswordField.Input defaultValue="hunter2" />
          <PasswordField.Toggle />
        </PasswordField.Root>,
      );

      const input = document.querySelector('input')!;

      await act(async () => {
        input.focus();
        input.setSelectionRange(2, 4);
      });

      await userEvent.click(screen.getByRole('button'));

      expect(input).toHaveFocus();
      expect(input).toHaveAttribute('type', 'text');
      // No explicit restoration: focus never leaves the input, and the browser keeps the
      // selection across the `password`/`text` swap on its own.
      expect(input.selectionStart).toBe(2);
      expect(input.selectionEnd).toBe(4);
    });

    it('keeps focus on the input when toggled with a pointer inside a closed shadow root', async () => {
      onTestFinished(resetBrowserPointer);
      const { userEvent } = await import('vitest/browser');
      const host = document.body.appendChild(document.createElement('div'));
      const shadowRoot = host.attachShadow({ mode: 'closed' });
      const container = shadowRoot.appendChild(document.createElement('div'));
      onTestFinished(() => host.remove());

      await render(
        <PasswordField.Root>
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
        { container },
      );

      const input = shadowRoot.querySelector('input')!;

      await act(async () => {
        input.focus();
      });
      expect(shadowRoot.activeElement).toBe(input);

      // A locator can't reach into a closed shadow root, so click the host where the toggle is.
      const buttonRect = shadowRoot.querySelector('button')!.getBoundingClientRect();
      const hostRect = host.getBoundingClientRect();
      await userEvent.click(host, {
        position: {
          x: buttonRect.left - hostRect.left + buttonRect.width / 2,
          y: buttonRect.top - hostRect.top + buttonRect.height / 2,
        },
      });

      expect(shadowRoot.activeElement).toBe(input);
      expect(input).toHaveAttribute('type', 'text');
    });

    it('moves focus to the toggle when it is pressed while the input is not focused', async () => {
      onTestFinished(resetBrowserPointer);
      const { userEvent } = await import('vitest/browser');
      await render(
        <PasswordField.Root>
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
      );

      const button = screen.getByRole('button');

      await userEvent.click(button);

      expect(button).toHaveFocus();
      expect(document.querySelector('input')).toHaveAttribute('type', 'text');
    });

    it('keeps focus on the toggle when activated with the keyboard', async () => {
      const { userEvent } = await import('vitest/browser');
      await render(
        <PasswordField.Root>
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
      );

      const button = screen.getByRole('button');

      await act(async () => {
        button.focus();
      });

      await userEvent.keyboard('[Space]');

      expect(button).toHaveFocus();
      expect(document.querySelector('input')).toHaveAttribute('type', 'text');
    });
  });

  it('does not toggle when a consumer click handler calls preventBaseUIHandler', async () => {
    await render(
      <PasswordField.Root>
        <PasswordField.Input />
        <PasswordField.Toggle onClick={(event) => event.preventBaseUIHandler()} />
      </PasswordField.Root>,
    );

    await act(async () => {
      screen.getByRole('button').click();
    });

    expect(document.querySelector('input')).toHaveAttribute('type', 'password');
  });

  it('calls a consumer click handler and still toggles', async () => {
    const onClick = vi.fn();
    await render(
      <PasswordField.Root>
        <PasswordField.Input />
        <PasswordField.Toggle onClick={onClick} />
      </PasswordField.Root>,
    );

    await act(async () => {
      screen.getByRole('button').click();
    });

    expect(onClick.mock.calls.length).toBe(1);
    expect(document.querySelector('input')).toHaveAttribute('type', 'text');
  });
});
