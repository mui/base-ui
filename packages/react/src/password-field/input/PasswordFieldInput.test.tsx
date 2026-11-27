import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { PasswordFieldPreview as PasswordField } from '@base-ui/react/password-field';
import { Field } from '@base-ui/react/field';
import { createRenderer, describeConformance } from '#test-utils';

describe('<PasswordField.Input />', () => {
  const { render } = createRenderer();

  describeConformance(<PasswordField.Input />, () => ({
    refInstanceof: window.HTMLInputElement,
    render(node) {
      return render(<PasswordField.Root>{node}</PasswordField.Root>);
    },
  }));

  it('passes the visibility to its state callbacks', async () => {
    const { user } = await render(
      <PasswordField.Root>
        <PasswordField.Input className={(state) => (state.revealed ? 'revealed' : 'masked')} />
        <PasswordField.Toggle />
      </PasswordField.Root>,
    );

    const input = document.querySelector('input')!;
    expect(input).toHaveClass('masked');
    expect(input).not.toHaveAttribute('data-revealed');

    await user.click(screen.getByRole('button'));

    expect(input).toHaveClass('revealed');
    expect(input).toHaveAttribute('data-revealed');
  });

  it("hides the browser's own reveal button on the input", async () => {
    await render(
      <PasswordField.Root>
        <PasswordField.Input />
      </PasswordField.Root>,
    );

    expect(document.querySelector('input')).toHaveClass('base-ui-hide-native-reveal');
    expect(
      Array.from(document.querySelectorAll('style')).some((element) =>
        element.textContent?.includes('.base-ui-hide-native-reveal::-ms-reveal'),
      ),
    ).toBe(true);
  });

  it('applies password-friendly defaults', async () => {
    await render(
      <PasswordField.Root>
        <PasswordField.Input />
      </PasswordField.Root>,
    );

    const input = document.querySelector('input')!;
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('autocomplete', 'current-password');
    expect(input).toHaveAttribute('autocapitalize', 'off');
    expect(input).toHaveAttribute('autocorrect', 'off');
    expect(input).toHaveAttribute('spellcheck', 'false');
  });

  it('allows overriding every default', async () => {
    await render(
      <PasswordField.Root>
        <PasswordField.Input
          autoComplete="new-password"
          autoCapitalize="on"
          autoCorrect="on"
          spellCheck
        />
      </PasswordField.Root>,
    );

    const input = document.querySelector('input')!;
    expect(input).toHaveAttribute('autocomplete', 'new-password');
    expect(input).toHaveAttribute('autocapitalize', 'on');
    expect(input).toHaveAttribute('autocorrect', 'on');
    expect(input).toHaveAttribute('spellcheck', 'true');
  });

  it('does not let a consumer-supplied type override the visibility-driven type', async () => {
    await render(
      <PasswordField.Root defaultRevealed>
        {/* @ts-expect-error `type` follows the visibility */}
        <PasswordField.Input type="email" />
        <PasswordField.Toggle />
      </PasswordField.Root>,
    );

    // Revealed -> `text`, never the consumer's `type`; the toggle stays functional.
    expect(document.querySelector('input')).toHaveAttribute('type', 'text');
  });

  it('has data-revealed while the password is revealed', async () => {
    await render(
      <PasswordField.Root>
        <PasswordField.Input data-testid="input" />
        <PasswordField.Toggle />
      </PasswordField.Root>,
    );

    const input = screen.getByTestId('input');
    expect(input).not.toHaveAttribute('data-revealed');

    await act(async () => {
      screen.getByRole('button').click();
    });

    expect(input).toHaveAttribute('data-revealed');
  });

  it('sets data-disabled when disabled', async () => {
    await render(
      <PasswordField.Root>
        <PasswordField.Input data-testid="input" disabled />
      </PasswordField.Root>,
    );

    expect(screen.getByTestId('input')).toHaveAttribute('data-disabled');
    expect(screen.getByTestId('input')).toBeDisabled();
  });

  it('ignores an id passed to the input, which the root owns', async () => {
    await render(
      <PasswordField.Root id="root-id">
        {/* @ts-expect-error `id` is set on the root */}
        <PasswordField.Input id="input-id" />
        <PasswordField.Toggle />
      </PasswordField.Root>,
    );

    expect(document.querySelector('input')).toHaveAttribute('id', 'root-id');
    expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'root-id');
  });

  it('keeps an id set on the render element and points the toggle at it', async () => {
    await render(
      <PasswordField.Root id="root-id">
        <PasswordField.Input render={<input id="actual" />} />
        <PasswordField.Toggle />
      </PasswordField.Root>,
    );

    expect(document.querySelector('input')).toHaveAttribute('id', 'actual');
    expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'actual');
  });

  describe('Field integration', () => {
    it('is labeled by Field.Label', async () => {
      await render(
        <Field.Root>
          <Field.Label>Password</Field.Label>
          <PasswordField.Root>
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </Field.Root>,
      );

      expect(screen.getByLabelText('Password').tagName).toBe('INPUT');
    });

    it('is labeled by Field.Label when the render element sets the id', async () => {
      await render(
        <Field.Root>
          <Field.Label>Password</Field.Label>
          <PasswordField.Root>
            <PasswordField.Input render={<input id="actual" />} />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </Field.Root>,
      );

      expect(screen.getByLabelText('Password')).toHaveAttribute('id', 'actual');
      expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'actual');
    });

    it('supports a controlled value with onValueChange', async () => {
      const onValueChange = vi.fn();

      function App() {
        const [value, setValue] = React.useState('');
        return (
          <PasswordField.Root>
            <PasswordField.Input
              value={value}
              onValueChange={(nextValue, eventDetails) => {
                onValueChange(nextValue, eventDetails);
                // The parent stores a transformed value, so the input must render the prop.
                setValue(nextValue.toUpperCase());
              }}
            />
          </PasswordField.Root>
        );
      }

      await render(<App />);
      const input = document.querySelector('input')!;

      fireEvent.change(input, { target: { value: 'secret' } });

      expect(onValueChange.mock.lastCall?.[0]).toBe('secret');
      expect(input.value).toBe('SECRET');
    });
  });
});
