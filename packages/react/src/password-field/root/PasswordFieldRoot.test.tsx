import { afterEach, beforeEach, expect, vi, describe, it, onTestFinished } from 'vitest';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { act, fireEvent, flushMicrotasks, screen } from '@mui/internal-test-utils';
import { PasswordFieldPreview as PasswordField } from '@base-ui/react/password-field';
import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';
import { createRenderer, isJSDOM, wait } from '#test-utils';
import { REASONS } from '../../internals/reasons';

describe('<PasswordField.Root />', () => {
  const { render, renderToString } = createRenderer();

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
      expect(button).toHaveAttribute('data-disabled');

      await act(async () => {
        button.click();
      });

      expect(onVisibleChange.mock.calls.length).toBe(0);
    });

    it('is disabled by a surrounding Fieldset.Root without a Field.Root', async () => {
      const onVisibleChange = vi.fn();
      await render(
        <Fieldset.Root disabled>
          <PasswordField.Root onVisibleChange={onVisibleChange}>
            <PasswordField.Input />
            <PasswordField.Toggle nativeButton={false} render={<span />} />
          </PasswordField.Root>
        </Fieldset.Root>,
      );

      const input = document.querySelector('input')!;
      const toggle = screen.getByRole('button');
      expect(input).toHaveAttribute('type', 'password');

      // A native `<fieldset disabled>` doesn't stop a click on a non-native toggle, but
      // `user.click` refuses to click inside one, so the click is dispatched directly.
      await act(async () => {
        toggle.click();
      });

      expect(input).toHaveAttribute('type', 'password');
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

  describe('prop: id', () => {
    it('sets the id of the input and points aria-controls at it', async () => {
      function App(props: { id: string }) {
        return (
          <PasswordField.Root id={props.id}>
            <PasswordField.Group data-testid="group">
              <PasswordField.Input />
              <PasswordField.Toggle />
            </PasswordField.Group>
          </PasswordField.Root>
        );
      }

      const { setProps } = await render(<App id="first" />);

      expect(document.querySelector('input')).toHaveAttribute('id', 'first');
      expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'first');
      expect(screen.getByTestId('group')).not.toHaveAttribute('id');

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
  });

  describe('form integration', () => {
    function reveal() {
      return act(async () => {
        screen.getByRole('button').click();
      });
    }

    it.each([
      { name: 'masked', defaultVisible: false, initialType: 'password', revealedType: 'text' },
      { name: 'visible', defaultVisible: true, initialType: 'text', revealedType: 'password' },
    ])(
      'restores the initial visibility when the form is reset and it was initially $name',
      async ({ defaultVisible, initialType, revealedType }) => {
        const onVisibleChange = vi.fn();
        await render(
          <form>
            <PasswordField.Root defaultVisible={defaultVisible} onVisibleChange={onVisibleChange}>
              <PasswordField.Input />
              <PasswordField.Toggle />
            </PasswordField.Root>
          </form>,
        );

        const input = document.querySelector('input')!;
        await reveal();
        expect(input).toHaveAttribute('type', revealedType);

        fireEvent.reset(input.form!);

        expect(input).toHaveAttribute('type', initialType);
        expect(onVisibleChange.mock.calls.length).toBe(2);
        expect(onVisibleChange.mock.lastCall?.[0]).toBe(defaultVisible);
        expect(onVisibleChange.mock.lastCall?.[1].reason).toBe(REASONS.formReset);
      },
    );

    it('does not restore the visibility when the form-reset change is canceled', async () => {
      await render(
        <form>
          <PasswordField.Root
            onVisibleChange={(_visible, eventDetails) => {
              if (eventDetails.reason === REASONS.formReset) {
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
      await reveal();
      expect(input).toHaveAttribute('type', 'text');

      fireEvent.reset(input.form!);

      expect(input).toHaveAttribute('type', 'text');
    });

    it.each([
      {
        name: 'stops its propagation',
        onReset: (event: React.FormEvent) => event.stopPropagation(),
      },
      {
        name: 'prevents it',
        onReset: (event: React.FormEvent) => event.preventDefault(),
      },
    ])('restores the initial visibility when an onReset handler $name', async ({ onReset }) => {
      const onVisibleChange = vi.fn();
      await render(
        <form onReset={onReset}>
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
      expect(onVisibleChange.mock.lastCall?.[1].reason).toBe(REASONS.formReset);
    });

    it('resets a controlled visibility through onVisibleChange', async () => {
      function App() {
        const [visible, setVisible] = React.useState(false);
        return (
          <form>
            <PasswordField.Root visible={visible} onVisibleChange={setVisible}>
              <PasswordField.Input />
              <PasswordField.Toggle />
            </PasswordField.Root>
          </form>
        );
      }

      await render(<App />);
      const input = document.querySelector('input')!;
      await reveal();
      expect(input).toHaveAttribute('type', 'text');

      fireEvent.reset(input.form!);

      expect(input).toHaveAttribute('type', 'password');
    });

    it('follows a `form` attribute changed by a re-render of only the input', async () => {
      let useFormB!: () => void;
      function Input() {
        const [form, setForm] = React.useState('a');
        useFormB = () => setForm('b');
        return <PasswordField.Input form={form} />;
      }
      const Field = React.memo(function Field() {
        return (
          <PasswordField.Root>
            <Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        );
      });

      await render(
        <React.Fragment>
          <form id="a" />
          <form id="b" />
          <Field />
        </React.Fragment>,
      );
      const input = document.querySelector('input')!;
      await reveal();
      await act(async () => useFormB());
      expect(input.form).toBe(document.querySelector('#b'));

      fireEvent.reset(document.querySelector('#a')!);
      expect(input).toHaveAttribute('type', 'text');

      fireEvent.reset(document.querySelector('#b')!);
      expect(input).toHaveAttribute('type', 'password');
    });

    it('follows a form that mounts after the field without re-rendering it', async () => {
      let mountForm!: () => void;
      function LateForm() {
        const [mounted, setMounted] = React.useState(false);
        mountForm = () => setMounted(true);
        return mounted ? <form id="late" /> : null;
      }
      const Field = React.memo(function Field() {
        return (
          <PasswordField.Root>
            <PasswordField.Input form="late" />
            <PasswordField.Toggle />
          </PasswordField.Root>
        );
      });

      await render(
        <React.Fragment>
          <Field />
          <LateForm />
        </React.Fragment>,
      );
      const input = document.querySelector('input')!;
      await reveal();
      expect(input).toHaveAttribute('type', 'text');
      await act(async () => mountForm());
      expect(input.form).toBe(document.querySelector('#late'));

      fireEvent.reset(input.form!);

      expect(input).toHaveAttribute('type', 'password');
    });

    it('restores the visibility on reset when the form and input are portaled into a shadow root', async () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const shadowRoot = host.attachShadow({ mode: 'open' });
      onTestFinished(() => host.remove());

      await render(
        <PasswordField.Root>
          {ReactDOM.createPortal(
            <form>
              <PasswordField.Input />
              <PasswordField.Toggle />
            </form>,
            shadowRoot as unknown as Element,
          )}
        </PasswordField.Root>,
      );

      const input = shadowRoot.querySelector('input')!;
      await act(async () => {
        shadowRoot.querySelector('button')!.click();
      });
      expect(input).toHaveAttribute('type', 'text');

      fireEvent.reset(input.form!);

      expect(input).toHaveAttribute('type', 'password');
    });

    function unmaskAfterSubmit() {
      return act(async () => {
        await wait(0);
      });
    }

    it('masks the input while the form submits, even when onVisibleChange cancels every change', async () => {
      // Masking doesn't go through onVisibleChange, so it can't be canceled or even observed there.
      const onVisibleChange = vi.fn((_visible: boolean, eventDetails: { cancel: () => void }) => {
        eventDetails.cancel();
      });
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
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');

      await unmaskAfterSubmit();

      expect(input).toHaveAttribute('type', 'text');
      expect(onVisibleChange.mock.calls.length).toBe(0);
    });

    it('masks the input on submit even if the submit handler stops propagation', async () => {
      await render(
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <PasswordField.Root defaultVisible>
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </form>,
      );

      const input = document.querySelector('input')!;
      expect(input).toHaveAttribute('type', 'text');

      fireEvent.submit(input.form!);

      expect(input).toHaveAttribute('type', 'password');
    });

    it('stays masked after the submit when the password was hidden during it', async () => {
      await render(
        <form onSubmit={(event) => event.preventDefault()}>
          <PasswordField.Root defaultVisible>
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </form>,
      );

      const input = document.querySelector('input')!;

      fireEvent.submit(input.form!);
      await reveal();
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');

      await unmaskAfterSubmit();

      expect(input).toHaveAttribute('type', 'password');
    });

    it('masks the input on submit when the form and input are portaled into a shadow root', async () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const shadowRoot = host.attachShadow({ mode: 'open' });
      onTestFinished(() => host.remove());

      await render(
        <PasswordField.Root defaultVisible>
          {ReactDOM.createPortal(
            <form onSubmit={(event) => event.preventDefault()}>
              <PasswordField.Input />
            </form>,
            shadowRoot as unknown as Element,
          )}
        </PasswordField.Root>,
      );

      const input = shadowRoot.querySelector('input')!;
      expect(input).toHaveAttribute('type', 'text');

      fireEvent.submit(input.form!);

      expect(input).toHaveAttribute('type', 'password');
    });

    it('does not call onVisibleChange on reset when the visibility would not change', async () => {
      const onVisibleChange = vi.fn();
      await render(
        <form>
          <PasswordField.Root onVisibleChange={onVisibleChange}>
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </form>,
      );

      fireEvent.reset(document.querySelector('form')!);

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

    describe.skipIf(isJSDOM)('submission in a browser', () => {
      const reactGlobals = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

      // React schedules updates as it does in an app, flushing them in microtasks, instead of
      // deferring them to the end of `act()`.
      beforeEach(() => {
        reactGlobals.IS_REACT_ACT_ENVIRONMENT = false;
      });

      afterEach(() => {
        reactGlobals.IS_REACT_ACT_ENVIRONMENT = true;
      });

      function App(props: {
        trigger: 'submit-button' | 'request-submit';
        updateOnSubmit: boolean;
        controlled: boolean;
      }) {
        const [submitCount, setSubmitCount] = React.useState(0);
        const formRef = React.useRef<HTMLFormElement>(null);
        return (
          <React.Fragment>
            {/* Submitting into the iframe builds the form data without navigating the page. */}
            <iframe name="submit-target" title="submit target" />
            <form
              ref={formRef}
              action="about:blank"
              target="submit-target"
              onSubmit={() => {
                if (props.updateOnSubmit) {
                  setSubmitCount((count) => count + 1);
                }
              }}
            >
              <PasswordField.Root
                {...(props.controlled ? { visible: true } : { defaultVisible: true })}
              >
                <PasswordField.Input name="password" defaultValue="hunter2" />
                <PasswordField.Toggle />
              </PasswordField.Root>
              <output>{submitCount}</output>
              {props.trigger === 'submit-button' ? (
                <button type="submit">Sign in</button>
              ) : (
                <button type="button" onClick={() => formRef.current!.requestSubmit()}>
                  Sign in
                </button>
              )}
            </form>
          </React.Fragment>
        );
      }

      it.each([
        {
          name: 'a submit button',
          trigger: 'submit-button',
          updateOnSubmit: false,
          controlled: false,
        },
        {
          name: 'a submit button whose onSubmit updates state',
          trigger: 'submit-button',
          updateOnSubmit: true,
          controlled: false,
        },
        {
          name: 'requestSubmit() in onClick',
          trigger: 'request-submit',
          updateOnSubmit: false,
          controlled: false,
        },
        {
          name: 'a submit button whose onSubmit updates state, with `visible` controlled',
          trigger: 'submit-button',
          updateOnSubmit: true,
          controlled: true,
        },
      ] as const)(
        'builds the form data with type="password" when submitted through $name',
        async ({ trigger, updateOnSubmit, controlled }) => {
          await render(
            <App trigger={trigger} updateOnSubmit={updateOnSubmit} controlled={controlled} />,
          );
          const input = document.querySelector<HTMLInputElement>('input[name="password"]')!;
          const typesAtFormData: string[] = [];
          input.form!.addEventListener('formdata', () => {
            typesAtFormData.push(input.type);
          });
          expect(input.type).toBe('text');

          // Real browser input dispatches the click with an empty stack, so microtasks run
          // between listeners, as they do for a user.
          const { userEvent } = await import('vitest/browser');
          await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

          expect(typesAtFormData).toEqual(['password']);
          await wait(10);
          expect(input.type).toBe('text');
        },
      );
    });
  });
});
