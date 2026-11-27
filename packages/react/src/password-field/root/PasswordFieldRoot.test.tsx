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

    it('respects defaultRevealed (uncontrolled)', async () => {
      await render(
        <PasswordField.Root defaultRevealed>
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
      );

      expect(document.querySelector('input')).toHaveAttribute('type', 'text');
    });

    it('respects revealed (controlled)', async () => {
      const { setProps } = await render(
        <PasswordField.Root revealed={false}>
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
      );

      const input = document.querySelector('input')!;
      expect(input).toHaveAttribute('type', 'password');

      await setProps({ revealed: true });
      expect(input).toHaveAttribute('type', 'text');
    });

    it('does not flip the type locally when controlled (click only notifies)', async () => {
      const onRevealedChange = vi.fn();
      await render(
        <PasswordField.Root revealed={false} onRevealedChange={onRevealedChange}>
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
      );

      const input = document.querySelector('input')!;

      await act(async () => {
        screen.getByRole('button').click();
      });

      // The controlled `revealed` prop wins: the click reports the request but the type stays put.
      expect(onRevealedChange.mock.calls.length).toBe(1);
      expect(onRevealedChange.mock.calls[0][0]).toBe(true);
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  describe('prop: onRevealedChange', () => {
    it('fires when the toggle is pressed', async () => {
      const onRevealedChange = vi.fn();
      await render(
        <PasswordField.Root onRevealedChange={onRevealedChange}>
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
      );

      await act(async () => {
        screen.getByRole('button').click();
      });

      expect(onRevealedChange.mock.calls.length).toBe(1);
      expect(onRevealedChange.mock.calls[0][0]).toBe(true);
      expect(onRevealedChange.mock.calls[0][1].reason).toBe(REASONS.none);
      expect(onRevealedChange.mock.calls[0][1].event).toBeInstanceOf(MouseEvent);
      expect(onRevealedChange.mock.calls[0][1].trigger).toBe(screen.getByRole('button'));
    });

    it('does not change visibility when the event is canceled', async () => {
      const onRevealedChange = vi.fn((_revealed: boolean, eventDetails: { cancel: () => void }) => {
        eventDetails.cancel();
      });
      await render(
        <PasswordField.Root onRevealedChange={onRevealedChange}>
          <PasswordField.Input />
          <PasswordField.Toggle />
        </PasswordField.Root>,
      );

      await act(async () => {
        screen.getByRole('button').click();
      });

      // The callback fired, but cancellation kept the password hidden.
      expect(onRevealedChange.mock.calls.length).toBe(1);
      expect(document.querySelector('input')).toHaveAttribute('type', 'password');
    });
  });

  describe('prop: disabled', () => {
    it('disables the input and the toggle', async () => {
      const onRevealedChange = vi.fn();
      await render(
        <PasswordField.Root disabled onRevealedChange={onRevealedChange}>
          <PasswordField.Input />
          <PasswordField.Toggle nativeButton={false} render={<span />} />
        </PasswordField.Root>,
      );

      const input = document.querySelector('input')!;
      const button = screen.getByRole('button');

      expect(input).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('data-disabled');

      await act(async () => {
        button.click();
      });

      expect(onRevealedChange.mock.calls.length).toBe(0);
    });

    it('is disabled by a surrounding Fieldset.Root without a Field.Root', async () => {
      const onRevealedChange = vi.fn();
      await render(
        <Fieldset.Root disabled>
          <PasswordField.Root onRevealedChange={onRevealedChange}>
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
      expect(onRevealedChange.mock.calls.length).toBe(0);
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
      { name: 'masked', defaultRevealed: false, initialType: 'password', revealedType: 'text' },
      { name: 'revealed', defaultRevealed: true, initialType: 'text', revealedType: 'password' },
    ])(
      'restores the initial visibility when the form is reset and it was initially $name',
      async ({ defaultRevealed, initialType, revealedType }) => {
        const onRevealedChange = vi.fn();
        await render(
          <form>
            <PasswordField.Root
              defaultRevealed={defaultRevealed}
              onRevealedChange={onRevealedChange}
            >
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
        expect(onRevealedChange.mock.calls.length).toBe(2);
        expect(onRevealedChange.mock.lastCall?.[0]).toBe(defaultRevealed);
        expect(onRevealedChange.mock.lastCall?.[1].reason).toBe(REASONS.formReset);
      },
    );

    it('does not restore the visibility when the form-reset change is canceled', async () => {
      await render(
        <form>
          <PasswordField.Root
            onRevealedChange={(_revealed, eventDetails) => {
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
        name: 'cancels it',
        onReset: (event: React.FormEvent) => event.preventDefault(),
        keepsValue: true,
      },
      {
        name: 'stops its propagation',
        onReset: (event: React.FormEvent) => event.stopPropagation(),
        keepsValue: false,
      },
    ])(
      'restores the visibility when an onReset handler $name, which only affects the native reset',
      async ({ onReset, keepsValue }) => {
        const onRevealedChange = vi.fn();
        const { user } = await render(
          <form onReset={onReset}>
            <PasswordField.Root onRevealedChange={onRevealedChange}>
              <PasswordField.Input defaultValue="hunter" />
              <PasswordField.Toggle />
            </PasswordField.Root>
          </form>,
        );

        const input = document.querySelector('input')!;
        await reveal();
        await user.type(input, '2');
        expect(input).toHaveAttribute('type', 'text');

        // Runs the browser's reset, which `fireEvent.reset` doesn't.
        await act(async () => {
          input.form!.reset();
        });

        expect(input).toHaveValue(keepsValue ? 'hunter2' : 'hunter');
        expect(input).toHaveAttribute('type', 'password');
        expect(onRevealedChange.mock.lastCall?.[1].reason).toBe(REASONS.formReset);
      },
    );

    it('resets a controlled visibility through onRevealedChange', async () => {
      function App() {
        const [revealed, setRevealed] = React.useState(false);
        return (
          <form>
            <PasswordField.Root revealed={revealed} onRevealedChange={setRevealed}>
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

    it('hides a revealed password when the form submits', async () => {
      const onRevealedChange = vi.fn();
      await render(
        <form>
          <PasswordField.Root defaultRevealed onRevealedChange={onRevealedChange}>
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </form>,
      );

      const input = document.querySelector('input')!;
      expect(input).toHaveAttribute('type', 'text');

      fireEvent.submit(input.form!);

      expect(input).toHaveAttribute('type', 'password');
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
      expect(onRevealedChange.mock.calls.length).toBe(1);
      expect(onRevealedChange.mock.lastCall?.[0]).toBe(false);
      expect(onRevealedChange.mock.lastCall?.[1].reason).toBe(REASONS.formSubmit);
    });

    it('keeps the password revealed when the form-submit change is canceled', async () => {
      await render(
        <form>
          <PasswordField.Root
            defaultRevealed
            onRevealedChange={(_revealed, eventDetails) => {
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
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });

    it('hides the password even when a submit handler prevents the submit', async () => {
      await render(
        <form onSubmit={(event) => event.preventDefault()}>
          <PasswordField.Root defaultRevealed>
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

    it('hides the password on submit even if the submit handler stops propagation', async () => {
      await render(
        <form onSubmit={(event) => event.stopPropagation()}>
          <PasswordField.Root defaultRevealed>
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

    it('hides the password on submit and restores it on reset for an input mounted after the Root', async () => {
      let showInput!: () => void;
      function App() {
        const [inputShown, setInputShown] = React.useState(false);
        showInput = () => setInputShown(true);
        return (
          <form>
            <PasswordField.Root>
              {inputShown && <PasswordField.Input />}
              <PasswordField.Toggle />
            </PasswordField.Root>
          </form>
        );
      }

      await render(<App />);
      await act(async () => showInput());
      const input = document.querySelector('input')!;
      await reveal();
      expect(input).toHaveAttribute('type', 'text');

      fireEvent.submit(input.form!);
      expect(input).toHaveAttribute('type', 'password');
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');

      await reveal();
      expect(input).toHaveAttribute('type', 'text');
      fireEvent.reset(input.form!);
      expect(input).toHaveAttribute('type', 'password');
    });

    it('hides the password on submit and restores it on reset when a render element mounts its input later', async () => {
      let showInput!: () => void;
      const DeferredInput = React.forwardRef(function DeferredInput(
        props: React.ComponentPropsWithoutRef<'input'>,
        ref: React.ForwardedRef<HTMLInputElement>,
      ) {
        const [inputShown, setInputShown] = React.useState(false);
        showInput = () => setInputShown(true);
        return inputShown ? <input ref={ref} {...props} /> : null;
      });

      await render(
        <form>
          <PasswordField.Root>
            <PasswordField.Input render={<DeferredInput />} />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </form>,
      );
      await act(async () => showInput());
      const input = document.querySelector('input')!;
      await reveal();
      expect(input).toHaveAttribute('type', 'text');

      fireEvent.submit(input.form!);
      expect(input).toHaveAttribute('type', 'password');
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');

      await reveal();
      expect(input).toHaveAttribute('type', 'text');
      fireEvent.reset(input.form!);
      expect(input).toHaveAttribute('type', 'password');
    });

    it('hides the password on submit when the form and input are portaled into a shadow root', async () => {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const shadowRoot = host.attachShadow({ mode: 'open' });
      onTestFinished(() => host.remove());

      await render(
        <PasswordField.Root defaultRevealed>
          {ReactDOM.createPortal(
            <form>
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

    it.each([
      { name: 'hides the password', cancelSubmit: false, expectedType: 'password' },
      {
        name: 'keeps the restored visibility when the form-submit change is canceled',
        cancelSubmit: true,
        expectedType: 'text',
      },
    ])(
      'applies a reset and then a submit in one handler in order, and $name',
      async ({ cancelSubmit, expectedType }) => {
        const changes: string[] = [];
        await render(
          <form onSubmit={(event) => event.preventDefault()}>
            <PasswordField.Root
              defaultRevealed
              onRevealedChange={(revealed, eventDetails) => {
                changes.push(`${revealed} ${eventDetails.reason}`);
                if (cancelSubmit && eventDetails.reason === REASONS.formSubmit) {
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
        // Hidden, so the reset reveals the password again before the submit.
        await reveal();
        expect(input).toHaveAttribute('type', 'password');

        await act(async () => {
          input.form!.reset();
          input.form!.requestSubmit();
        });

        expect(changes).toEqual([
          `false ${REASONS.none}`,
          `true ${REASONS.formReset}`,
          `false ${REASONS.formSubmit}`,
        ]);
        expect(input).toHaveAttribute('type', expectedType);
      },
    );

    it('does not call onRevealedChange on reset when the visibility would not change', async () => {
      const onRevealedChange = vi.fn();
      await render(
        <form>
          <PasswordField.Root onRevealedChange={onRevealedChange}>
            <PasswordField.Input />
            <PasswordField.Toggle />
          </PasswordField.Root>
        </form>,
      );

      fireEvent.reset(document.querySelector('form')!);

      expect(onRevealedChange.mock.calls.length).toBe(0);
    });

    it('follows the form owner set through the `form` attribute', async () => {
      function App(props: { form: string }) {
        return (
          <React.Fragment>
            <form id="a" />
            <form id="b" />
            <PasswordField.Root defaultRevealed>
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
        trigger: 'submit-button' | 'request-submit' | 'submit-method';
        updateOnSubmit: boolean;
        controlled: boolean;
      }) {
        const [submitCount, setSubmitCount] = React.useState(0);
        const [revealed, setRevealed] = React.useState(true);
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
                {...(props.controlled
                  ? { revealed, onRevealedChange: setRevealed }
                  : { defaultRevealed: true })}
              >
                <PasswordField.Input name="password" defaultValue="hunter2" />
                <PasswordField.Toggle />
              </PasswordField.Root>
              <output>{submitCount}</output>
              {props.trigger === 'submit-button' ? (
                <button type="submit">Sign in</button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    props.trigger === 'submit-method'
                      ? formRef.current!.submit()
                      : formRef.current!.requestSubmit()
                  }
                >
                  Sign in
                </button>
              )}
            </form>
          </React.Fragment>
        );
      }

      it('hides a revealed password on a submit dispatched in a transition', async () => {
        await render(
          <React.Fragment>
            <iframe name="transition-target" title="submit target" />
            <form action="about:blank" target="transition-target">
              <PasswordField.Root defaultRevealed>
                <PasswordField.Input />
                <PasswordField.Toggle />
              </PasswordField.Root>
            </form>
          </React.Fragment>,
        );

        const input = document.querySelector('input')!;
        expect(input.type).toBe('text');

        React.startTransition(() => {
          input.form!.requestSubmit();
        });
        await wait(50);

        expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
        expect(input.type).toBe('password');
      });

      it.each([
        {
          name: 'a submit button',
          hides: true,
          trigger: 'submit-button',
          updateOnSubmit: false,
          controlled: false,
        },
        {
          name: 'a submit button whose onSubmit updates state',
          hides: true,
          trigger: 'submit-button',
          updateOnSubmit: true,
          controlled: false,
        },
        {
          name: 'requestSubmit() in onClick',
          hides: true,
          trigger: 'request-submit',
          updateOnSubmit: false,
          controlled: false,
        },
        {
          name: 'form.submit() in onClick, which fires no submit event or hide',
          hides: false,
          trigger: 'submit-method',
          updateOnSubmit: false,
          controlled: false,
        },
        {
          name: 'a submit button whose onSubmit updates state, with `revealed` controlled',
          hides: true,
          trigger: 'submit-button',
          updateOnSubmit: true,
          controlled: true,
        },
      ] as const)(
        'keeps the password out of autofill when submitted through $name',
        async ({ trigger, updateOnSubmit, controlled, hides }) => {
          await render(
            <App trigger={trigger} updateOnSubmit={updateOnSubmit} controlled={controlled} />,
          );
          const input = document.querySelector<HTMLInputElement>('input[name="password"]')!;
          // What the browser sees when it reads the form: a password field, or a text field with
          // autocomplete off.
          const seenAtFormData: string[] = [];
          input.form!.addEventListener('formdata', () => {
            seenAtFormData.push(
              input.type === 'password' || input.autocomplete === 'off'
                ? 'protected'
                : `${input.type}, ${input.autocomplete}`,
            );
          });
          expect(input.type).toBe('text');

          // Real browser input dispatches the click with an empty stack, so microtasks run
          // between listeners, as they do for a user.
          const { userEvent } = await import('vitest/browser');
          await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

          expect(seenAtFormData).toEqual(['protected']);
          await wait(10);
          expect(input.type).toBe(hides ? 'password' : 'text');
        },
      );
    });
  });
});
