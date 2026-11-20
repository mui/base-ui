import { expect, vi, describe, it } from 'vitest';
import * as React from 'react';
import { act, fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { PasswordFieldPreview as PasswordField } from '@base-ui/react/password-field';
import { Field } from '@base-ui/react/field';
import { createRenderer, describeConformance } from '#test-utils';
import { REASONS } from '../../internals/reasons';

describe('<PasswordField.Root />', () => {
  const { render, renderToString } = createRenderer();

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

      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
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
        <PasswordField.Root disabled onVisibleChange={onVisibleChange} data-testid="root">
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
      );

      const input = document.querySelector('input')!;
      const button = screen.getByRole('button');

      expect(input).toBeDisabled();
      expect(button).toBeDisabled();
      expect(screen.getByTestId('root')).toHaveAttribute('data-disabled');
      expect(button).toHaveAttribute('data-disabled');

      await act(async () => {
        button.click();
      });

      expect(onVisibleChange.mock.calls.length).toBe(0);
    });

    it('is disabled by a surrounding Field.Root', async () => {
      await render(
        <Field.Root disabled>
          <PasswordField.Root data-testid="root">
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </Field.Root>,
      );

      expect(document.querySelector('input')).toBeDisabled();
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByTestId('root')).toHaveAttribute('data-disabled');
    });
  });

  describe('prop: id', () => {
    it('sets the id of the input and points aria-controls at it', async () => {
      function App(props: { id: string }) {
        return (
          <PasswordField.Root id={props.id} data-testid="root">
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        );
      }

      const { setProps } = await render(<App id="first" />);

      expect(document.querySelector('input')).toHaveAttribute('id', 'first');
      expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'first');
      expect(screen.getByTestId('root')).not.toHaveAttribute('id');

      await setProps({ id: 'second' });

      expect(document.querySelector('input')).toHaveAttribute('id', 'second');
      expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'second');
    });

    it('generates an id that is present in server-rendered markup', async () => {
      renderToString(
        <PasswordField.Root>
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
      );

      const input = document.querySelector('input')!;
      expect(input.id).not.toBe('');
      expect(screen.getByRole('button')).toHaveAttribute('aria-controls', input.id);
    });
  });

  describe('Field integration', () => {
    it('uses the id from Field.Root in server-rendered markup and keeps it after mount', async () => {
      const { hydrate } = renderToString(
        <Field.Root>
          <Field.Label>Password</Field.Label>
          <PasswordField.Root>
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </Field.Root>,
      );

      const serverId = document.querySelector('input')!.id;
      expect(serverId).not.toBe('');
      expect(screen.getByRole('button')).toHaveAttribute('aria-controls', serverId);
      expect(screen.getByText('Password')).toHaveAttribute('for', serverId);

      hydrate();
      await flushMicrotasks();

      expect(document.querySelector('input')).toHaveAttribute('id', serverId);
      expect(screen.getByRole('button')).toHaveAttribute('aria-controls', serverId);
      expect(screen.getByText('Password')).toHaveAttribute('for', serverId);
    });

    it('registers an explicit id with Field.Root', async () => {
      await render(
        <Field.Root>
          <Field.Label>Password</Field.Label>
          <PasswordField.Root id="password">
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </Field.Root>,
      );

      expect(document.querySelector('input')).toHaveAttribute('id', 'password');
      expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'password');
      expect(screen.getByText('Password')).toHaveAttribute('for', 'password');
    });

    it('reflects the Field state on the root', async () => {
      await render(
        <Field.Root invalid>
          <PasswordField.Root data-testid="root">
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </Field.Root>,
      );

      const root = screen.getByTestId('root');
      expect(root).toHaveAttribute('data-invalid');
      expect(root).not.toHaveAttribute('data-focused');

      await act(async () => {
        document.querySelector('input')!.focus();
      });

      expect(root).toHaveAttribute('data-focused');
    });
  });

  describe('form integration', () => {
    function reveal() {
      return act(async () => {
        screen.getByRole('button').click();
      });
    }

    it('restores the initial visibility when the form is reset', async () => {
      const onVisibleChange = vi.fn();
      await render(
        <form>
          <PasswordField.Root onVisibleChange={onVisibleChange}>
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </form>,
      );

      const input = document.querySelector('input')!;
      await reveal();
      expect(input).toHaveAttribute('type', 'text');

      fireEvent.reset(input.form!);

      expect(input).toHaveAttribute('type', 'password');
      expect(onVisibleChange.mock.calls.length).toBe(2);
      expect(onVisibleChange.mock.lastCall?.[0]).toBe(false);
      expect(onVisibleChange.mock.lastCall?.[1].reason).toBe(REASONS.formReset);
    });

    it('reveals the password again on reset when it was initially visible', async () => {
      await render(
        <form>
          <PasswordField.Root defaultVisible>
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </form>,
      );

      const input = document.querySelector('input')!;
      await reveal();
      expect(input).toHaveAttribute('type', 'password');

      fireEvent.reset(input.form!);

      expect(input).toHaveAttribute('type', 'text');
    });

    it('does not restore the visibility when the reset is canceled', async () => {
      const onVisibleChange = vi.fn();
      await render(
        <form onReset={(event) => event.preventDefault()}>
          <PasswordField.Root onVisibleChange={onVisibleChange}>
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </form>,
      );

      const input = document.querySelector('input')!;
      await reveal();
      expect(input).toHaveAttribute('type', 'text');

      fireEvent.reset(input.form!);

      expect(input).toHaveAttribute('type', 'text');
      expect(onVisibleChange.mock.calls.length).toBe(1);
    });

    it('hides the password when the form is submitted, even if the submit is prevented', async () => {
      const onVisibleChange = vi.fn();
      await render(
        <form onSubmit={(event) => event.preventDefault()}>
          <PasswordField.Root defaultVisible onVisibleChange={onVisibleChange}>
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </form>,
      );

      const input = document.querySelector('input')!;
      expect(input).toHaveAttribute('type', 'text');

      fireEvent.submit(input.form!);

      expect(input).toHaveAttribute('type', 'password');
      expect(onVisibleChange.mock.calls.length).toBe(1);
      expect(onVisibleChange.mock.calls[0][0]).toBe(false);
      expect(onVisibleChange.mock.calls[0][1].reason).toBe(REASONS.formSubmit);
    });

    it('keeps the password visible on submit when the change is canceled', async () => {
      await render(
        <form onSubmit={(event) => event.preventDefault()}>
          <PasswordField.Root
            defaultVisible
            onVisibleChange={(_visible, eventDetails) => {
              if (eventDetails.reason === REASONS.formSubmit) {
                eventDetails.cancel();
              }
            }}
          >
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </form>,
      );

      const input = document.querySelector('input')!;

      fireEvent.submit(input.form!);

      expect(input).toHaveAttribute('type', 'text');
    });

    it('does not call onVisibleChange on submit or reset when the visibility would not change', async () => {
      const onVisibleChange = vi.fn();
      await render(
        <form onSubmit={(event) => event.preventDefault()}>
          <PasswordField.Root onVisibleChange={onVisibleChange}>
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </form>,
      );

      const form = document.querySelector('form')!;

      fireEvent.submit(form);
      fireEvent.reset(form);

      expect(onVisibleChange.mock.calls.length).toBe(0);
    });

    it('follows the form owner set through the `form` attribute', async () => {
      function App(props: { form: string }) {
        return (
          <React.Fragment>
            <form id="a" />
            <form id="b" />
            <PasswordField.Root defaultVisible>
              <PasswordField.Input form={props.form} />
              <PasswordField.Toggle />
            </PasswordField.Root>
          </React.Fragment>
        );
      }

      const { setProps } = await render(<App form="a" />);
      const input = document.querySelector('input')!;

      await setProps({ form: 'b' });

      fireEvent.submit(document.querySelector('#a')!);
      expect(input).toHaveAttribute('type', 'text');

      fireEvent.submit(document.querySelector('#b')!);
      expect(input).toHaveAttribute('type', 'password');
    });
  });
});
