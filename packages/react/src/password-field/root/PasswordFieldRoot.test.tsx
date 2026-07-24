import { expect, vi } from 'vitest';
import * as React from 'react';
import { act, fireEvent, screen } from '@mui/internal-test-utils';
import { PasswordFieldPreview as PasswordField } from '@base-ui/react/password-field';
import { Field } from '@base-ui/react/field';
import { createRenderer, describeConformance } from '#test-utils';
import { REASONS } from '../../internals/reasons';

describe('<PasswordField.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<PasswordField.Root />, () => ({
    refInstanceof: window.HTMLDivElement,
    render,
  }));

  describe('visibility state', () => {
    it('is hidden by default', async () => {
      await render(
        <PasswordField.Root>
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(document.querySelector('input')).toHaveAttribute('type', 'password');
    });

    it('respects defaultVisible (uncontrolled)', async () => {
      await render(
        <PasswordField.Root defaultVisible>
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
      );

      expect(document.querySelector('input')).toHaveAttribute('type', 'text');
    });

    it('respects visible (controlled)', async () => {
      const { setProps } = await render(
        <PasswordField.Root visible={false}>
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
      );

      const input = document.querySelector('input')!;
      expect(input).toHaveAttribute('type', 'password');

      await setProps({ visible: true });
      expect(input).toHaveAttribute('type', 'text');
    });

    it('does not flip the type locally when controlled (click only notifies)', async () => {
      const onVisibleChange = vi.fn();
      await render(
        <PasswordField.Root visible={false} onVisibleChange={onVisibleChange}>
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
      );

      const input = document.querySelector('input')!;

      await act(async () => {
        screen.getByRole('button').click();
      });

      // The controlled `visible` prop wins: the click reports the request but the type stays put.
      expect(onVisibleChange.mock.calls.length).toBe(1);
      expect(onVisibleChange.mock.calls[0][0]).toBe(true);
      expect(input).toHaveAttribute('type', 'password');
    });

    it('exposes visible to render callbacks without emitting data-visible', async () => {
      await render(
        <PasswordField.Root
          data-testid="root"
          defaultVisible
          className={(state) => (state.visible ? 'visible' : 'hidden')}
        >
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
      );

      expect(screen.getByTestId('root')).toHaveClass('visible');
      expect(screen.getByTestId('root')).not.toHaveAttribute('data-visible');
    });
  });

  describe('prop: onVisibleChange', () => {
    it('fires when the toggle is pressed', async () => {
      const onVisibleChange = vi.fn();
      await render(
        <PasswordField.Root onVisibleChange={onVisibleChange}>
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
      );

      await act(async () => {
        screen.getByRole('button').click();
      });

      expect(onVisibleChange.mock.calls.length).toBe(1);
      expect(onVisibleChange.mock.calls[0][0]).toBe(true);
      expect(onVisibleChange.mock.calls[0][1].reason).toBe(REASONS.triggerPress);
      expect(onVisibleChange.mock.calls[0][1].event).toBeInstanceOf(MouseEvent);
      expect(onVisibleChange.mock.calls[0][1].trigger).toBe(screen.getByRole('button'));
    });

    it('does not change visibility when the event is canceled', async () => {
      const onVisibleChange = vi.fn((_visible: boolean, eventDetails: { cancel: () => void }) => {
        eventDetails.cancel();
      });
      await render(
        <PasswordField.Root onVisibleChange={onVisibleChange}>
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
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
        <PasswordField.Root disabled onVisibleChange={onVisibleChange}>
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
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
          <PasswordField.Root>
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </Field.Root>,
      );

      expect(document.querySelector('input')).toBeDisabled();
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('form integration', () => {
    const { render: renderForm, clock } = createRenderer();

    clock.withFakeTimers();

    it('hides the password and fires onVisibleChange when the form is reset', async () => {
      const onVisibleChange = vi.fn();
      await renderForm(
        <form>
          <PasswordField.Root defaultVisible onVisibleChange={onVisibleChange}>
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </form>,
      );

      const input = document.querySelector('input')!;
      expect(input).toHaveAttribute('type', 'text');

      fireEvent.reset(input.form!);
      await act(async () => {
        clock.tick(0);
      });

      expect(input).toHaveAttribute('type', 'password');
      expect(onVisibleChange.mock.calls[0][0]).toBe(false);
      expect(onVisibleChange.mock.calls[0][1].reason).toBe(REASONS.none);
    });

    it('does not hide when the reset is canceled', async () => {
      const onVisibleChange = vi.fn();
      await renderForm(
        <form onReset={(event) => event.preventDefault()}>
          <PasswordField.Root defaultVisible onVisibleChange={onVisibleChange}>
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </form>,
      );

      const input = document.querySelector('input')!;

      fireEvent.reset(input.form!);
      await act(async () => {
        clock.tick(0);
      });

      expect(input).toHaveAttribute('type', 'text');
      expect(onVisibleChange).not.toHaveBeenCalled();
    });

    it('hides the password when the form is submitted, even if the submit is prevented', async () => {
      const onVisibleChange = vi.fn();
      await renderForm(
        <form onSubmit={(event) => event.preventDefault()}>
          <PasswordField.Root defaultVisible onVisibleChange={onVisibleChange}>
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
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
