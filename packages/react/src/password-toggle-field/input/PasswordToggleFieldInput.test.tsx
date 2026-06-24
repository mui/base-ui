import { expect } from 'vitest';
import * as React from 'react';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { PasswordToggleFieldPreview as PasswordToggleField } from '@base-ui/react/password-toggle-field';
import { Field } from '@base-ui/react/field';
import { createRenderer, describeConformance } from '#test-utils';

describe('<PasswordToggleField.Input />', () => {
  const { render } = createRenderer();

  describeConformance(<PasswordToggleField.Input />, () => ({
    refInstanceof: window.HTMLInputElement,
    render(node) {
      return render(<PasswordToggleField.Root>{node}</PasswordToggleField.Root>);
    },
  }));

  it('applies password-friendly defaults', async () => {
    await render(
      <PasswordToggleField.Root>
        <PasswordToggleField.Input />
      </PasswordToggleField.Root>,
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
      <PasswordToggleField.Root>
        <PasswordToggleField.Input
          autoComplete="new-password"
          autoCapitalize="on"
          autoCorrect="on"
          spellCheck
        />
      </PasswordToggleField.Root>,
    );

    const input = document.querySelector('input')!;
    expect(input).toHaveAttribute('autocomplete', 'new-password');
    expect(input).toHaveAttribute('autocapitalize', 'on');
    expect(input).toHaveAttribute('autocorrect', 'on');
    expect(input).toHaveAttribute('spellcheck', 'true');
  });

  it('does not let a consumer-supplied type override the visibility-driven type', async () => {
    await render(
      <PasswordToggleField.Root defaultVisible>
        <PasswordToggleField.Input type="email" />
        <PasswordToggleField.Toggle />
      </PasswordToggleField.Root>,
    );

    // Visible -> `text`, never the consumer's `type`; the toggle stays functional.
    expect(document.querySelector('input')).toHaveAttribute('type', 'text');
  });

  it('reflects the revealed state through the native type, not a data attribute', async () => {
    await render(
      <PasswordToggleField.Root defaultVisible>
        <PasswordToggleField.Input data-testid="input" />
      </PasswordToggleField.Root>,
    );

    expect(screen.getByTestId('input')).toHaveAttribute('type', 'text');
    expect(screen.getByTestId('input')).not.toHaveAttribute('data-visible');
  });

  it('sets data-disabled when disabled', async () => {
    await render(
      <PasswordToggleField.Root>
        <PasswordToggleField.Input data-testid="input" disabled />
      </PasswordToggleField.Root>,
    );

    expect(screen.getByTestId('input')).toHaveAttribute('data-disabled');
    expect(screen.getByTestId('input')).toBeDisabled();
  });

  it('uses the provided id', async () => {
    await render(
      <PasswordToggleField.Root>
        <PasswordToggleField.Input id="my-password" />
        <PasswordToggleField.Toggle />
      </PasswordToggleField.Root>,
    );

    expect(document.querySelector('input')).toHaveAttribute('id', 'my-password');
    expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'my-password');
  });

  it("keeps the toggle's aria-controls in sync when the input id changes", async () => {
    function App(props: { id: string }) {
      return (
        <PasswordToggleField.Root>
          <PasswordToggleField.Input id={props.id} />
          <PasswordToggleField.Toggle />
        </PasswordToggleField.Root>
      );
    }

    const { setProps } = await render(<App id="first" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'first');

    await setProps({ id: 'second' });
    expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'second');
  });

  describe('Field integration', () => {
    it('is labeled by Field.Label', async () => {
      await render(
        <Field.Root>
          <Field.Label>Password</Field.Label>
          <PasswordToggleField.Root>
            <PasswordToggleField.Input />
            <PasswordToggleField.Toggle />
          </PasswordToggleField.Root>
        </Field.Root>,
      );

      expect(screen.getByLabelText('Password').tagName).toBe('INPUT');
    });

    it('reflects the Field filled state', async () => {
      await render(
        <Field.Root>
          <PasswordToggleField.Root>
            <PasswordToggleField.Input data-testid="input" defaultValue="hunter2" />
          </PasswordToggleField.Root>
        </Field.Root>,
      );

      expect(screen.getByTestId('input')).toHaveAttribute('data-filled');
    });

    it('supports a controlled value', async () => {
      function App() {
        const [value, setValue] = React.useState('');
        return (
          <PasswordToggleField.Root>
            <PasswordToggleField.Input
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </PasswordToggleField.Root>
        );
      }

      await render(<App />);
      const input = document.querySelector('input')!;

      fireEvent.change(input, { target: { value: 'secret' } });

      expect(input.value).toBe('secret');
    });
  });
});
