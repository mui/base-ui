import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { fireEvent, screen } from '@mui/internal-test-utils';
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
      <PasswordField.Root defaultVisible>
        {/* @ts-expect-error `type` follows the visibility */}
        <PasswordField.Input type="email" />
        <PasswordField.Toggle />
      </PasswordField.Root>,
    );

    // Visible -> `text`, never the consumer's `type`; the toggle stays functional.
    expect(document.querySelector('input')).toHaveAttribute('type', 'text');
  });

  it('reflects the revealed state through the native type, not a data attribute', async () => {
    await render(
      <PasswordField.Root defaultVisible>
        <PasswordField.Input data-testid="input" />
      </PasswordField.Root>,
    );

    expect(screen.getByTestId('input')).toHaveAttribute('type', 'text');
    expect(screen.getByTestId('input')).not.toHaveAttribute('data-visible');
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

    it('reflects the Field filled state', async () => {
      await render(
        <Field.Root>
          <PasswordField.Root>
            <PasswordField.Input data-testid="input" defaultValue="hunter2" />
          </PasswordField.Root>
        </Field.Root>,
      );

      expect(screen.getByTestId('input')).toHaveAttribute('data-filled');
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
                setValue(nextValue);
              }}
            />
          </PasswordField.Root>
        );
      }

      await render(<App />);
      const input = document.querySelector('input')!;

      fireEvent.change(input, { target: { value: 'secret' } });

      expect(input.value).toBe('secret');
      expect(onValueChange.mock.lastCall?.[0]).toBe('secret');
      expect(onValueChange.mock.lastCall?.[1].reason).toBe('none');
      expect(onValueChange.mock.lastCall?.[1].event).toBeInstanceOf(Event);
    });
  });
});
