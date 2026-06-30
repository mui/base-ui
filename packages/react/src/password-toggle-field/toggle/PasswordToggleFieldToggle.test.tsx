import { expect, vi } from 'vitest';
import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { act, screen } from '@mui/internal-test-utils';
import { PasswordToggleFieldPreview as PasswordToggleField } from '@base-ui/react/password-toggle-field';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

describe('<PasswordToggleField.Toggle />', () => {
  const { render } = createRenderer();

  describeConformance(<PasswordToggleField.Toggle />, () => ({
    refInstanceof: window.HTMLButtonElement,
    button: true,
    render(node) {
      return render(<PasswordToggleField.Root>{node}</PasswordToggleField.Root>);
    },
  }));

  it('toggles the password visibility when clicked', async () => {
    await render(
      <PasswordToggleField.Root>
        <PasswordToggleField.Input />
        <PasswordToggleField.Toggle />
      </PasswordToggleField.Root>,
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

  it('reflects the visibility through aria-pressed and data-pressed', async () => {
    await render(
      <PasswordToggleField.Root>
        <PasswordToggleField.Input />
        <PasswordToggleField.Toggle />
      </PasswordToggleField.Root>,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).not.toHaveAttribute('data-pressed');

    await act(async () => {
      button.click();
    });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-pressed');
  });

  it('stays a non-submitting button even if a consumer passes type="submit"', async () => {
    await render(
      <PasswordToggleField.Root>
        <PasswordToggleField.Input />
        <PasswordToggleField.Toggle type="submit" />
      </PasswordToggleField.Root>,
    );

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  describe('aria-controls', () => {
    it('omits aria-controls until an input is registered', async () => {
      await render(
        <PasswordToggleField.Root>
          <PasswordToggleField.Toggle />
        </PasswordToggleField.Root>,
      );

      expect(screen.getByRole('button')).not.toHaveAttribute('aria-controls');
    });

    it('points aria-controls at the input', async () => {
      await render(
        <PasswordToggleField.Root>
          <PasswordToggleField.Input id="pwd" />
          <PasswordToggleField.Toggle />
        </PasswordToggleField.Root>,
      );

      expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'pwd');
    });
  });

  describe('accessible label', () => {
    it('does not set a default aria-label (the consumer provides a localized one)', async () => {
      await render(
        <PasswordToggleField.Root>
          <PasswordToggleField.Input />
          <PasswordToggleField.Toggle />
        </PasswordToggleField.Root>,
      );

      expect(screen.getByRole('button')).not.toHaveAttribute('aria-label');
    });

    it('forwards an explicit aria-label', async () => {
      await render(
        <PasswordToggleField.Root>
          <PasswordToggleField.Input />
          <PasswordToggleField.Toggle aria-label="Reveal password" />
        </PasswordToggleField.Root>,
      );

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Reveal password');
    });
  });

  describe('prop: disabled', () => {
    it('does not toggle when disabled', async () => {
      await render(
        <PasswordToggleField.Root>
          <PasswordToggleField.Input />
          <PasswordToggleField.Toggle disabled />
        </PasswordToggleField.Root>,
      );

      const input = document.querySelector('input')!;
      const button = screen.getByRole('button');

      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('data-disabled');

      await act(async () => {
        button.click();
      });
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  describe('prop: nativeButton', () => {
    it('toggles the password visibility when rendered as a non-native button', async () => {
      await render(
        <PasswordToggleField.Root>
          <PasswordToggleField.Input />
          <PasswordToggleField.Toggle nativeButton={false} render={<span />} />
        </PasswordToggleField.Root>,
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
        <PasswordToggleField.Root>
          <PasswordToggleField.Input />
          <PasswordToggleField.Toggle nativeButton={false} render={<span />} disabled />
        </PasswordToggleField.Root>,
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

  describe.skipIf(isJSDOM)('focus management', () => {
    it('keeps focus on the input when toggled with a pointer', async () => {
      await render(
        <PasswordToggleField.Root>
          <PasswordToggleField.Input />
          <PasswordToggleField.Toggle />
        </PasswordToggleField.Root>,
      );

      const input = document.querySelector('input')!;
      const button = screen.getByRole('button');

      await act(async () => {
        input.focus();
      });

      await userEvent.click(button);

      expect(input).toHaveFocus();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('keeps focus on the toggle when activated with the keyboard', async () => {
      await render(
        <PasswordToggleField.Root>
          <PasswordToggleField.Input />
          <PasswordToggleField.Toggle />
        </PasswordToggleField.Root>,
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

  it.skipIf(isJSDOM)('preserves the caret position after toggling with a pointer', async () => {
    await render(
      <PasswordToggleField.Root>
        <PasswordToggleField.Input defaultValue="hunter2" />
        <PasswordToggleField.Toggle />
      </PasswordToggleField.Root>,
    );

    const input = document.querySelector('input')!;
    const button = screen.getByRole('button');

    await act(async () => {
      input.focus();
      input.setSelectionRange(2, 4);
    });

    await userEvent.click(button);

    // No explicit restoration: `mousedown` is prevented so focus never leaves the input, and
    // the browser keeps the selection across the `password`/`text` swap on its own.
    expect(input.selectionStart).toBe(2);
    expect(input.selectionEnd).toBe(4);
  });

  it('forwards the click handler', async () => {
    const onClick = vi.fn();
    await render(
      <PasswordToggleField.Root>
        <PasswordToggleField.Input />
        <PasswordToggleField.Toggle onClick={onClick} />
      </PasswordToggleField.Root>,
    );

    await act(async () => {
      screen.getByRole('button').click();
    });

    expect(onClick.mock.calls.length).toBe(1);
  });
});
