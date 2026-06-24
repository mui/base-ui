import { expect, vi } from 'vitest';
import * as React from 'react';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { PasswordToggleFieldPreview as PasswordToggleField } from '@base-ui/react/password-toggle-field';
import { Field } from '@base-ui/react/field';
import { createRenderer, describeConformance } from '#test-utils';
import { REASONS } from '../../internals/reasons';

describe('<PasswordToggleField.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<PasswordToggleField.Root />, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe('visibility state', () => {
    it('is hidden by default', async () => {
      await render(
        <PasswordToggleField.Root>
          <PasswordToggleField.Input />
          <PasswordToggleField.Toggle />
        </PasswordToggleField.Root>,
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(document.querySelector('input')).toHaveAttribute('type', 'password');
    });

    it('respects defaultVisible (uncontrolled)', async () => {
      await render(
        <PasswordToggleField.Root defaultVisible>
          <PasswordToggleField.Input />
          <PasswordToggleField.Toggle />
        </PasswordToggleField.Root>,
      );

      expect(document.querySelector('input')).toHaveAttribute('type', 'text');
    });

    it('respects visible (controlled)', async () => {
      const { setProps } = await render(
        <PasswordToggleField.Root visible={false}>
          <PasswordToggleField.Input />
          <PasswordToggleField.Toggle />
        </PasswordToggleField.Root>,
      );

      const input = document.querySelector('input')!;
      expect(input).toHaveAttribute('type', 'password');

      await setProps({ visible: true });
      expect(input).toHaveAttribute('type', 'text');
    });

    it('does not emit data-visible on the root (reserved for element visibility)', async () => {
      await render(
        <PasswordToggleField.Root data-testid="root" defaultVisible>
          <PasswordToggleField.Input />
          <PasswordToggleField.Toggle />
        </PasswordToggleField.Root>,
      );

      expect(screen.getByTestId('root')).not.toHaveAttribute('data-visible');
    });
  });

  describe('prop: onVisibleChange', () => {
    it('fires when the toggle is pressed', async () => {
      const onVisibleChange = vi.fn();
      await render(
        <PasswordToggleField.Root onVisibleChange={onVisibleChange}>
          <PasswordToggleField.Input />
          <PasswordToggleField.Toggle />
        </PasswordToggleField.Root>,
      );

      await act(async () => {
        screen.getByRole('button').click();
      });

      expect(onVisibleChange.mock.calls.length).toBe(1);
      expect(onVisibleChange.mock.calls[0][0]).toBe(true);
      expect(onVisibleChange.mock.calls[0][1].reason).toBe(REASONS.none);
      expect(onVisibleChange.mock.calls[0][1].event).toBeInstanceOf(Event);
    });

    it('does not change visibility when the event is canceled', async () => {
      const onVisibleChange = vi.fn((_visible: boolean, eventDetails: { cancel: () => void }) => {
        eventDetails.cancel();
      });
      await render(
        <PasswordToggleField.Root onVisibleChange={onVisibleChange}>
          <PasswordToggleField.Input />
          <PasswordToggleField.Toggle />
        </PasswordToggleField.Root>,
      );

      await act(async () => {
        screen.getByRole('button').click();
      });

      // The callback fired, but cancellation kept the password hidden.
      expect(onVisibleChange.mock.calls.length).toBe(1);
      expect(document.querySelector('input')).toHaveAttribute('type', 'password');
    });
  });

  describe('prop: disabled', () => {
    it('disables the input and the toggle', async () => {
      const onVisibleChange = vi.fn();
      await render(
        <PasswordToggleField.Root disabled onVisibleChange={onVisibleChange}>
          <PasswordToggleField.Input />
          <PasswordToggleField.Toggle />
        </PasswordToggleField.Root>,
      );

      const input = document.querySelector('input')!;
      const button = screen.getByRole('button');

      expect(input).toBeDisabled();
      expect(button).toBeDisabled();

      await act(async () => {
        button.click();
      });

      expect(onVisibleChange.mock.calls.length).toBe(0);
    });

    it('is disabled by a surrounding Field.Root', async () => {
      await render(
        <Field.Root disabled>
          <PasswordToggleField.Root>
            <PasswordToggleField.Input />
            <PasswordToggleField.Toggle />
          </PasswordToggleField.Root>
        </Field.Root>,
      );

      expect(document.querySelector('input')).toBeDisabled();
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('form integration', () => {
    it('hides the password and fires onVisibleChange when the form is reset', async () => {
      const onVisibleChange = vi.fn();
      await render(
        <form>
          <PasswordToggleField.Root defaultVisible onVisibleChange={onVisibleChange}>
            <PasswordToggleField.Input />
            <PasswordToggleField.Toggle />
          </PasswordToggleField.Root>
        </form>,
      );

      const input = document.querySelector('input')!;
      expect(input).toHaveAttribute('type', 'text');

      fireEvent.reset(input.form!);

      expect(input).toHaveAttribute('type', 'password');
      expect(onVisibleChange.mock.calls[0][0]).toBe(false);
      expect(onVisibleChange.mock.calls[0][1].reason).toBe(REASONS.none);
    });

    it('does not hide when the reset is canceled', async () => {
      await render(
        <form>
          <PasswordToggleField.Root defaultVisible>
            <PasswordToggleField.Input />
            <PasswordToggleField.Toggle />
          </PasswordToggleField.Root>
        </form>,
      );

      const input = document.querySelector('input')!;
      // A capture-phase listener cancels the reset before the component observes it.
      input.form!.addEventListener('reset', (event) => event.preventDefault(), { capture: true });

      fireEvent.reset(input.form!);

      expect(input).toHaveAttribute('type', 'text');
    });

    it('hides the password when the form is submitted, even if the submit is prevented', async () => {
      const onVisibleChange = vi.fn();
      await render(
        <form onSubmit={(event) => event.preventDefault()}>
          <PasswordToggleField.Root defaultVisible onVisibleChange={onVisibleChange}>
            <PasswordToggleField.Input />
            <PasswordToggleField.Toggle />
          </PasswordToggleField.Root>
        </form>,
      );

      const input = document.querySelector('input')!;
      expect(input).toHaveAttribute('type', 'text');

      // A revealed password must never persist after a submission attempt.
      input.form!.addEventListener('submit', (event) => event.preventDefault(), { capture: true });

      fireEvent.submit(input.form!);

      expect(input).toHaveAttribute('type', 'password');
      expect(onVisibleChange.mock.calls[0][0]).toBe(false);
    });
  });
});
