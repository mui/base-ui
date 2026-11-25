import { expect, describe, it } from 'vitest';
import * as React from 'react';
import { flushMicrotasks, screen } from '@mui/internal-test-utils';
import { PasswordFieldPreview as PasswordField } from '@base-ui/react/password-field';
import { Field } from '@base-ui/react/field';
import { createRenderer, describeConformance } from '#test-utils';

describe('<PasswordField.Label />', () => {
  const { render, renderToString } = createRenderer();

  describeConformance(<PasswordField.Label />, () => ({
    refInstanceof: window.HTMLLabelElement,
    render(node) {
      return render(<PasswordField.Root>{node}</PasswordField.Root>);
    },
  }));

  it('labels the input with a native label', async () => {
    await render(
      <PasswordField.Root>
        <PasswordField.Label>Password</PasswordField.Label>
        <PasswordField.Input />
      </PasswordField.Root>,
    );

    const label = screen.getByText('Password');
    const input = document.querySelector('input')!;
    expect(label.tagName).toBe('LABEL');
    expect(input.id).not.toBe('');
    expect(label).toHaveAttribute('for', input.id);
    expect(screen.getByLabelText('Password')).toBe(input);
  });

  it('points at the id set on the Root', async () => {
    await render(
      <PasswordField.Root id="password">
        <PasswordField.Label>Password</PasswordField.Label>
        <PasswordField.Input />
      </PasswordField.Root>,
    );

    expect(screen.getByText('Password')).toHaveAttribute('for', 'password');
  });

  it('points at an id set on the Input render element', async () => {
    await render(
      <PasswordField.Root id="password">
        <PasswordField.Label>Password</PasswordField.Label>
        <PasswordField.Input render={<input id="custom-password" />} />
      </PasswordField.Root>,
    );

    expect(document.querySelector('input')).toHaveAttribute('id', 'custom-password');
    expect(screen.getByText('Password')).toHaveAttribute('for', 'custom-password');
  });

  it('points at the input in server-rendered markup and after hydration', async () => {
    const { hydrate } = renderToString(
      <PasswordField.Root>
        <PasswordField.Label>Password</PasswordField.Label>
        <PasswordField.Input />
      </PasswordField.Root>,
    );

    const serverId = document.querySelector('input')!.id;
    expect(serverId).not.toBe('');
    expect(screen.getByText('Password')).toHaveAttribute('for', serverId);

    hydrate();
    await flushMicrotasks();

    expect(document.querySelector('input')).toHaveAttribute('id', serverId);
    expect(screen.getByText('Password')).toHaveAttribute('for', serverId);
  });

  it('has data-revealed while the password is revealed', async () => {
    await render(
      <PasswordField.Root defaultRevealed>
        <PasswordField.Label>Password</PasswordField.Label>
        <PasswordField.Input />
      </PasswordField.Root>,
    );

    expect(screen.getByText('Password')).toHaveAttribute('data-revealed');
  });

  describe('Field integration', () => {
    it('labels the input with the id from Field.Root', async () => {
      await render(
        <Field.Root>
          <PasswordField.Root>
            <PasswordField.Label>Password</PasswordField.Label>
            <PasswordField.Input />
          </PasswordField.Root>
        </Field.Root>,
      );

      const label = screen.getByText('Password');
      const input = document.querySelector('input')!;
      expect(input.id).not.toBe('');
      expect(label).toHaveAttribute('for', input.id);
      expect(input).toHaveAttribute('aria-labelledby', label.id);
    });

    it('registers an id set on its render element as the input label', async () => {
      await render(
        <Field.Root>
          <PasswordField.Root>
            <PasswordField.Label render={<label id="password-label" />}>
              Password
            </PasswordField.Label>
            <PasswordField.Input />
          </PasswordField.Root>
        </Field.Root>,
      );

      expect(screen.getByText('Password')).toHaveAttribute('id', 'password-label');
      expect(document.querySelector('input')).toHaveAttribute('aria-labelledby', 'password-label');
    });

    it('reflects the Field state', async () => {
      await render(
        <Field.Root invalid disabled>
          <PasswordField.Root>
            <PasswordField.Label>Password</PasswordField.Label>
            <PasswordField.Input />
          </PasswordField.Root>
        </Field.Root>,
      );

      const label = screen.getByText('Password');
      expect(label).toHaveAttribute('data-invalid');
      expect(label).toHaveAttribute('data-disabled');
    });
  });
});
