import { expect, describe, it } from 'vitest';
import * as React from 'react';
import { act, screen } from '@mui/internal-test-utils';
import { PasswordFieldPreview as PasswordField } from '@base-ui/react/password-field';
import { Field } from '@base-ui/react/field';
import { createRenderer, describeConformance } from '#test-utils';

describe('<PasswordField.Group />', () => {
  const { render } = createRenderer();

  describeConformance(<PasswordField.Group />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<PasswordField.Root>{node}</PasswordField.Root>);
    },
  }));

  it('reflects the revealed state through data-revealed and render callbacks', async () => {
    await render(
      <PasswordField.Root defaultRevealed>
        <PasswordField.Group
          data-testid="group"
          className={(state) => (state.revealed ? 'revealed' : 'hidden')}
        >
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Group>
      </PasswordField.Root>,
    );

    const group = screen.getByTestId('group');
    expect(group).toHaveClass('revealed');
    expect(group).toHaveAttribute('data-revealed');

    await act(async () => {
      screen.getByRole('button').click();
    });

    expect(group).toHaveClass('hidden');
    expect(group).not.toHaveAttribute('data-revealed');
  });

  it('has data-disabled when the Root is disabled', async () => {
    await render(
      <PasswordField.Root disabled>
        <PasswordField.Group data-testid="group">
          <PasswordField.Input />
        </PasswordField.Group>
      </PasswordField.Root>,
    );

    expect(screen.getByTestId('group')).toHaveAttribute('data-disabled');
  });

  it('has data-disabled when a surrounding Field.Root is disabled', async () => {
    await render(
      <Field.Root disabled>
        <PasswordField.Root>
          <PasswordField.Group data-testid="group">
            <PasswordField.Input />
          </PasswordField.Group>
        </PasswordField.Root>
      </Field.Root>,
    );

    expect(screen.getByTestId('group')).toHaveAttribute('data-disabled');
  });

  it('reflects the Field state', async () => {
    await render(
      <Field.Root invalid>
        <PasswordField.Root>
          <PasswordField.Group data-testid="group">
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Group>
        </PasswordField.Root>
      </Field.Root>,
    );

    const group = screen.getByTestId('group');
    expect(group).toHaveAttribute('data-invalid');
    expect(group).not.toHaveAttribute('data-focused');

    await act(async () => {
      document.querySelector('input')!.focus();
    });

    expect(group).toHaveAttribute('data-focused');
  });
});
