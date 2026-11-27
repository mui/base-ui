import * as React from 'react';
import { expect, describe, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { Field } from '@base-ui/react/field';
import type { createRenderer } from '#test-utils';

/**
 * The Field behavior that every text control built on `useFieldControl` shares, such as
 * `Field.Control`, Input and PasswordField.Input.
 */
export function fieldControlConformanceTests(config: FieldControlConformanceTestsConfig) {
  const { render, createComponent } = config;

  describe('Field integration', () => {
    it('is labeled by Field.Label', async () => {
      await render(
        <Field.Root>
          <Field.Label>Label</Field.Label>
          {createComponent({})}
        </Field.Root>,
      );

      const input = document.querySelector('input')!;
      expect(input.id).not.toBe('');
      expect(screen.getByText('Label')).toHaveAttribute('for', input.id);
    });

    it('reflects the focused, filled, dirty and touched state', async () => {
      await render(<Field.Root>{createComponent({ 'data-testid': 'control' })}</Field.Root>);

      const input = screen.getByTestId('control');
      expect(input).not.toHaveAttribute('data-focused');
      expect(input).not.toHaveAttribute('data-filled');
      expect(input).not.toHaveAttribute('data-dirty');

      await act(async () => {
        input.focus();
      });
      expect(input).toHaveAttribute('data-focused');

      fireEvent.change(input, { target: { value: 'a' } });
      expect(input).toHaveAttribute('data-filled');
      expect(input).toHaveAttribute('data-dirty');
      expect(input).not.toHaveAttribute('data-touched');

      await act(async () => {
        input.blur();
      });
      expect(input).not.toHaveAttribute('data-focused');
      expect(input).toHaveAttribute('data-touched');
    });

    it('is focused when it mounts with autoFocus', async () => {
      await render(
        <Field.Root>{createComponent({ autoFocus: true, 'data-testid': 'control' })}</Field.Root>,
      );

      expect(screen.getByTestId('control')).toHaveAttribute('data-focused');
    });

    it('reflects the validity', async () => {
      await render(
        <Field.Root validationMode="onChange">
          {createComponent({ required: true, 'data-testid': 'control' })}
        </Field.Root>,
      );

      const input = screen.getByTestId('control');
      fireEvent.change(input, { target: { value: 'a' } });
      expect(input).toHaveAttribute('data-valid');

      fireEvent.change(input, { target: { value: '' } });
      expect(input).toHaveAttribute('data-invalid');
      expect(input).not.toHaveAttribute('data-valid');
    });

    it('calls onValueChange with the new value', async () => {
      const onValueChange = vi.fn();
      await render(<Field.Root>{createComponent({ onValueChange })}</Field.Root>);

      fireEvent.change(document.querySelector('input')!, { target: { value: 'a' } });

      expect(onValueChange.mock.calls.length).toBe(1);
      expect(onValueChange.mock.calls[0][0]).toBe('a');
    });

    it('is disabled by Field.Root', async () => {
      await render(
        <Field.Root disabled>{createComponent({ 'data-testid': 'control' })}</Field.Root>,
      );

      const input = screen.getByTestId('control');
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute('data-disabled');
    });
  });
}

export interface FieldControlConformanceTestsConfig {
  render: ReturnType<typeof createRenderer>['render'];
  /**
   * Renders the control, wrapped in whatever its parts require, with the given props on it.
   */
  createComponent: (props: {
    onValueChange?: ((value: string) => void) | undefined;
    'data-testid'?: string | undefined;
    autoFocus?: boolean | undefined;
    required?: boolean | undefined;
  }) => React.ReactElement;
}
